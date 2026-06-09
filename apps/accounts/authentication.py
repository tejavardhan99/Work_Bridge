import jwt
from django.conf import settings
from rest_framework import authentication, exceptions

from apps.accounts.documents import User
from apps.accounts.services import _resolve_user_by_id


class JWTAuthentication(authentication.BaseAuthentication):
    keyword = "Bearer"

    def authenticate_header(self, request):
        return self.keyword

    def authenticate(self, request):
        header = authentication.get_authorization_header(request).decode("utf-8")
        if not header:
            return None

        parts = header.split()
        if len(parts) != 2 or parts[0] != self.keyword:
            raise exceptions.AuthenticationFailed("Invalid authorization header.")

        try:
            payload = jwt.decode(parts[1], settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        except jwt.ExpiredSignatureError as exc:
            raise exceptions.AuthenticationFailed("Token has expired.") from exc
        except jwt.InvalidTokenError as exc:
            raise exceptions.AuthenticationFailed("Invalid token.") from exc

        if payload.get("type") != "access":
            raise exceptions.AuthenticationFailed("Access token required.")

        user = _resolve_user_by_id(payload.get("sub"))
        if not user or not user.is_active or user.is_blocked:
            raise exceptions.AuthenticationFailed("User is inactive or blocked.")

        return (AuthenticatedUser(user), payload)


class AuthenticatedUser:
    def __init__(self, user):
        self.document = user
        self.id = str(user.id)
        self.name = user.name
        self.role = user.role
        self.is_authenticated = True
        self.is_staff = user.role == User.ROLE_ADMIN
