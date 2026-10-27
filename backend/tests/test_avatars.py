from io import BytesIO

import httpx
import pytest
from fastapi import HTTPException
from PIL import Image
from sqlalchemy.orm import Session

from app.features.auth.models import Profile
from app.features.users.service import prepare_avatar
from app.integrations.storage.client import AvatarStorage
from tests.storage_mocks import StorageMock


def photo():
    output = BytesIO()
    Image.new('RGB', (640, 300), 'orange').save(output, 'PNG')
    return output.getvalue()


def test_avatar_requires_login_and_valid_image(client, credentials):
    assert client.post('/api/users/me/avatar', content=photo()).status_code == 401
    client.post('/api/auth/signup', json=credentials)
    client.post('/api/auth/login', json={'identifier': credentials['email'], 'password': credentials['password']})
    assert client.post('/api/users/me/avatar', content=b'not an image').status_code == 400
    assert client.post('/api/users/me/avatar', content=b'x' * (5 * 1024 * 1024 + 1)).status_code == 413
    assert client.post('/api/users/me/avatar', content=photo(), headers={'Origin': 'https://other.test'}).status_code == 403


def test_replaces_only_current_user_avatar_and_returns_persistent_url(client, credentials, engine):
    storage = StorageMock()
    client.app.state.avatar_storage = storage
    client.post('/api/auth/signup', json={**credentials, 'country_code': 'CA', 'city': ' Toronto '})
    login = client.post('/api/auth/login', json={'identifier': credentials['email'], 'password': credentials['password']})
    assert login.json()['user']['city'] == 'Toronto'
    assert login.json()['user']['country_code'] == 'CA'
    user_id = login.json()['user']['id']
    response = client.post('/api/users/me/avatar', content=photo())
    assert response.status_code == 200
    first_path, data, _token = storage.uploads[0]
    assert first_path.startswith(f'{user_id}/')
    with Image.open(BytesIO(data)) as image:
        assert image.format == 'WEBP'
        assert image.size == (512, 512)
        assert not image.getexif()
    assert response.json()['avatar_url'].endswith(first_path)
    response = client.post('/api/users/me/avatar', content=photo())
    assert response.status_code == 200
    assert storage.deleted == [first_path]
    assert client.get('/api/auth/session').json()['user']['avatar_url'] == response.json()['avatar_url']
    client.post('/api/auth/logout')
    other = {**credentials, 'email': 'other@example.com', 'username': 'other_reader'}
    client.post('/api/auth/signup', json=other)
    client.post('/api/auth/login', json={'identifier': other['email'], 'password': other['password']})
    client.post('/api/users/me/avatar', content=photo())
    assert storage.uploads[-1][0].split('/')[0] != user_id
    assert storage.deleted == [first_path]
    with Session(engine) as db:
        assert sum(profile.avatar_path is not None for profile in db.query(Profile).all()) == 2


def test_upload_failure_preserves_previous_avatar(client, credentials):
    storage = StorageMock()
    client.app.state.avatar_storage = storage
    client.post('/api/auth/signup', json=credentials)
    client.post('/api/auth/login', json={'identifier': credentials['email'], 'password': credentials['password']})
    original = client.post('/api/users/me/avatar', content=photo()).json()['avatar_url']
    def fail(*args):
        raise HTTPException(503, 'Storage unavailable')
    storage.upload = fail
    assert client.post('/api/users/me/avatar', content=photo()).status_code == 503
    assert client.get('/api/auth/session').json()['user']['avatar_url'] == original
    assert storage.deleted == []


def test_image_format_validation_ignores_claimed_mime_type():
    with pytest.raises(HTTPException):
        prepare_avatar(b'<svg><script>alert(1)</script></svg>')


def test_storage_uses_per_request_user_token(settings):
    requests = []
    def respond(request):
        requests.append(request)
        return httpx.Response(200, json={})
    storage = AvatarStorage(settings, transport=httpx.MockTransport(respond))
    storage.upload('one/photo.webp', b'webp', 'first-token')
    storage.upload('two/photo.webp', b'webp', 'second-token')
    storage.remove('one/photo.webp', 'first-token')
    assert requests[0].headers['authorization'] == 'Bearer first-token'
    assert requests[1].headers['authorization'] == 'Bearer second-token'
    assert requests[2].headers['authorization'] == 'Bearer first-token'
    assert requests[0].headers['content-type'] == 'image/webp'
    assert requests[0].headers['apikey'] == 'test-publishable-key'
    storage.close()
