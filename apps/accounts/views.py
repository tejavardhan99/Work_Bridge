from django.conf import settings
from rest_framework import permissions, status
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.views import APIView

from apps.accounts.documents import User
from apps.accounts.serializers import AuthIndexSerializer, DemoTokensSerializer, LoginSerializer, RefreshSerializer, RegisterSerializer
from apps.accounts.services import authenticate_user, create_tokens, refresh_access_token, register_user
from apps.common.responses import success
from apps.employers.services import create_employer_profile
from apps.workers.services import create_worker_profile


class AuthIndexView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    serializer_class = AuthIndexSerializer

    def get(self, request):
        return success(
            {
                "worker_register": "/api/v1/auth/worker-register/",
                "worker_login": "/api/v1/auth/worker-login/",
                "employer_register": "/api/v1/auth/employer-register/",
                "employer_login": "/api/v1/auth/employer-login/",
                "admin_login": "/api/v1/auth/admin-login/",
                "refresh": "/api/v1/auth/refresh/",
                "demo_tokens": "/api/v1/auth/demo-tokens/",
                "note": "Registration and login endpoints require POST with JSON.",
            }
        )


class DemoTokensView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    serializer_class = DemoTokensSerializer

    def get(self, request):
        if not settings.DEBUG:
            raise PermissionDenied("Demo tokens are available only when DJANGO_DEBUG=True.")

        users = {
            "worker": User.objects(email="worker.demo@workbridge.local").first(),
            "employer": User.objects(email="employer.demo@workbridge.local").first(),
            "admin": User.objects(email="admin.demo@workbridge.local").first(),
        }
        missing = [role for role, user in users.items() if not user]
        if missing:
            raise NotFound(f"Demo users not found: {', '.join(missing)}. Run `python manage.py seed_demo_data --reset-demo` first.")

        return success(
            {
                role: {
                    "user": serialize_user(user),
                    "tokens": create_tokens(user),
                }
                for role, user in users.items()
            },
            "Demo tokens generated.",
        )


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    serializer_class = RegisterSerializer
    role = None

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated_data = serializer.validated_data
        location = validated_data.pop('location', None)
        user = register_user(role=self.role, **validated_data)
        if self.role == User.ROLE_WORKER:
            create_worker_profile(user, location=location)
        if self.role == User.ROLE_EMPLOYER:
            create_employer_profile(user, location=location)
        return success({"user": serialize_user(user), "tokens": create_tokens(user)}, "Registered successfully.", status.HTTP_201_CREATED)


class WorkerRegisterView(RegisterView):
    role = User.ROLE_WORKER


class EmployerRegisterView(RegisterView):
    role = User.ROLE_EMPLOYER


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    serializer_class = LoginSerializer
    role = None

    def post(self, request):
        print(f"Login attempt for role={self.role}: {request.data}")
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate_user(role=self.role, **serializer.validated_data)
        return success({"user": serialize_user(user), "tokens": create_tokens(user)}, "Logged in successfully.")


class WorkerLoginView(LoginView):
    role = User.ROLE_WORKER


class EmployerLoginView(LoginView):
    role = User.ROLE_EMPLOYER


class AdminLoginView(LoginView):
    role = User.ROLE_ADMIN


class RefreshTokenView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    serializer_class = RefreshSerializer

    def post(self, request):
        serializer = RefreshSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return success({"tokens": refresh_access_token(serializer.validated_data["refresh"])}, "Token refreshed.")


def serialize_user(user):
    return {"id": str(user.id), "name": user.name, "phone": user.phone, "email": user.email, "role": user.role}
