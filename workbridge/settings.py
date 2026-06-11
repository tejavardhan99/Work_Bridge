import os
from pathlib import Path
from datetime import timedelta

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY") or os.getenv("SECRET_KEY", "dev-only-workbridge-secret")
DEBUG = (os.getenv("DJANGO_DEBUG") or os.getenv("DEBUG", "False")).lower() == "true"
ALLOWED_HOSTS = [
    host.strip()
    for host in (os.getenv("DJANGO_ALLOWED_HOSTS") or os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1")).split(",")
    if host.strip()
] + [
    "work-bridge-4wnp.onrender.com",
    "localhost",
    "127.0.0.1",
]

INSTALLED_APPS = [
    "corsheaders",
    "rest_framework",
    "drf_spectacular",
    "apps.common.apps.CommonConfig",
    "apps.accounts.apps.AccountsConfig",
    "apps.workers.apps.WorkersConfig",
    "apps.employers.apps.EmployersConfig",
    "apps.jobs.apps.JobsConfig",
    "apps.recommendations.apps.RecommendationsConfig",
    "apps.notifications.apps.NotificationsConfig",
    "apps.admin_ops.apps.AdminOpsConfig",
    "apps.applications.apps.ApplicationsConfig",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.middleware.common.CommonMiddleware",
]

ROOT_URLCONF = "workbridge.urls"
WSGI_APPLICATION = "workbridge.wsgi.application"
ASGI_APPLICATION = "workbridge.asgi.application"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [],
        },
    }
]

# Domain data lives in Firebase Realtime Database through Firebase Admin SDK.
# The dummy backend avoids accidentally creating a local SQLite database.
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.dummy",
    }
}

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": ["apps.accounts.authentication.JWTAuthentication"],
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAuthenticated"],
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "EXCEPTION_HANDLER": "apps.common.exceptions.api_exception_handler",
    "UNAUTHENTICATED_USER": None,
    "UNAUTHENTICATED_TOKEN": None,
}

SPECTACULAR_SETTINGS = {
    "TITLE": "WorkBridge API",
    "DESCRIPTION": "AI-powered location-based temporary job platform for rural workers.",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "COMPONENT_SPLIT_REQUEST": True,
}

# Firebase Realtime Database configuration
FIREBASE_DATABASE_URL = os.getenv(
    "FIREBASE_DATABASE_URL",
    "https://smart-finder-9c485-default-rtdb.asia-southeast1.firebasedatabase.app/",
)
FIREBASE_SERVICE_ACCOUNT_FILE = os.getenv(
    "FIREBASE_SERVICE_ACCOUNT_FILE",
    str(BASE_DIR / "firebase-key.json"),
)

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", SECRET_KEY)
JWT_ALGORITHM = "HS256"
JWT_ACCESS_TOKEN_LIFETIME = timedelta(minutes=int(os.getenv("JWT_ACCESS_TOKEN_MINUTES", "60")))
JWT_REFRESH_TOKEN_LIFETIME = timedelta(days=int(os.getenv("JWT_REFRESH_TOKEN_DAYS", "7")))

CORS_ALLOWED_ORIGINS = [
    "http://localhost:4200",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://work-bridge-chi.vercel.app",
    "https://work-bridge-git-main-tejavardhan99s-projects.vercel.app",
    "https://work-bridge-lunws18of-tejavardhan99s-projects.vercel.app",
]
CORS_ALLOW_CREDENTIALS = True

MEDIA_URL = os.getenv("MEDIA_URL", "/media/")
MEDIA_ROOT = BASE_DIR / os.getenv("MEDIA_ROOT", "media")

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG


