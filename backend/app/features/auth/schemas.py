from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class SignupRequest(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    username: str = Field(pattern=r"^[a-zA-Z0-9_]{3,24}$")
    email: EmailStr = Field(max_length=254)
    password: str = Field(min_length=12, max_length=256)

    @field_validator("name", "username", "email", mode="before")
    @classmethod
    def trim(cls, value):
        return value.strip() if isinstance(value, str) else value


class LoginRequest(BaseModel):
    identifier: str = Field(min_length=1, max_length=254)
    password: str = Field(min_length=1, max_length=256)
    remember: bool = False


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    username: str


class SessionResponse(BaseModel):
    user: UserResponse
    expiresAt: int


class MessageResponse(BaseModel):
    message: str


class ResetRequest(BaseModel):
    email: EmailStr = Field(max_length=254)


class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=32, max_length=256)
    password: str = Field(min_length=12, max_length=256)


class ConfirmEmailRequest(BaseModel):
    token: str = Field(min_length=16, max_length=512)
