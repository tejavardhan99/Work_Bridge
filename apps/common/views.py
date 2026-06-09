from drf_spectacular.utils import extend_schema
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.firebase_config import ping_firebase
from apps.common.serializers import (
    HealthErrorResponseSerializer,
    HealthResponseSerializer,
)


class HealthCheckView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    @extend_schema(
        tags=["System"],
        responses={
            200: HealthResponseSerializer,
            503: HealthErrorResponseSerializer,
        },
    )
    def get(self, request):
        database = ping_firebase()
        if database["connected"]:
            return Response(
                {
                    "success": True,
                    "message": "OK",
                    "database": database,
                },
                status=200,
            )

        return Response(
            {
                "success": False,
                "status_code": 503,
                "error": {
                    "code": "database_unavailable",
                    "message": "Firebase Realtime Database connection failed",
                    "target": "firebase_realtime_database",
                },
            },
            status=503,
        )
