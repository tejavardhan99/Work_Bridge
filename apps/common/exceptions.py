from firebase_admin import exceptions as firebase_exceptions
from rest_framework import status
from rest_framework.exceptions import NotAuthenticated
from rest_framework.response import Response
from rest_framework.views import exception_handler

from apps.common.firebase_config import get_configured_target


def api_exception_handler(exc, context):
    if isinstance(exc, (firebase_exceptions.FirebaseError, ConnectionError, TimeoutError)):
        return Response(
            {
                "success": False,
                "status_code": status.HTTP_503_SERVICE_UNAVAILABLE,
                "error": {
                    "code": "database_unavailable",
                    "message": "Firebase Realtime Database is not reachable. Configure FIREBASE_SERVICE_ACCOUNT_FILE and FIREBASE_DATABASE_URL in .env and restart Django.",
                    "configured_target": get_configured_target(),
                    "firebase_fix": "Provide a valid Firebase service account JSON path and DATABASE_URL in environment variables, then restart Django.",
                },
            },
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    if isinstance(exc, NotAuthenticated):
        return Response(
            {
                "success": False,
                "status_code": status.HTTP_401_UNAUTHORIZED,
                "error": {
                    "code": "authentication_required",
                    "message": "This API is protected. Login or register first, then send Authorization: Bearer YOUR_ACCESS_TOKEN.",
                    "public_auth_apis": {
                        "worker_register": "/api/v1/auth/worker-register/",
                        "worker_login": "/api/v1/auth/worker-login/",
                        "employer_register": "/api/v1/auth/employer-register/",
                        "employer_login": "/api/v1/auth/employer-login/",
                        "admin_login": "/api/v1/auth/admin-login/",
                        "demo_tokens": "/api/v1/auth/demo-tokens/",
                    },
                    "swagger_help": "In Swagger, call login/register, copy data.tokens.access, click Authorize, and paste only the token value.",
                },
            },
            status=status.HTTP_401_UNAUTHORIZED,
            headers={"WWW-Authenticate": "Bearer"},
        )

    response = exception_handler(exc, context)
    if response is None:
        return response

    response.data = {
        "success": False,
        "status_code": response.status_code,
        "error": response.data,
    }
    return response
