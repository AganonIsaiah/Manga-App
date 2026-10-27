"""In-memory Storage fixture; production always uses the Supabase REST adapter."""


class StorageMock:
    def __init__(self):
        self.uploads = []
        self.deleted = []
        self.objects = {}

    def upload(self, path, data, token):
        self.uploads.append((path, data, token))
        self.objects[path] = data

    def remove(self, path, token):
        self.deleted.append(path)
        self.objects.pop(path, None)
