# WorkBridge Backend

WorkBridge is a Django + DRF backend for an AI-powered, location-based temporary job platform for rural workers. It uses Firebase Realtime Database through the Firebase Admin SDK, JWT authentication, role-based APIs, and a service-layer recommendation workflow that can later evolve into deeper scikit-learn models.

Swagger UI:

```text
http://127.0.0.1:8000/api/docs/
```

OpenAPI schema is available at `/api/schema/`; Redoc is available at `/api/redoc/`.

## Backend Folder Structure

```text
workbridge/
  settings.py              # Production-ready Django settings and Firebase env config
  urls.py                  # Versioned API router
apps/
  accounts/                # Users, JWT auth, OTP hooks, admin creation command
  workers/                 # Worker profile, skills, availability, trust score APIs
  employers/               # Employer profile and hiring workflows
  jobs/                    # Jobs, applications, reviews, complaints
  recommendations/         # Rule scoring and scikit-learn extension point
  notifications/           # User notification APIs
  admin_ops/               # Admin dashboard, fraud, complaints, moderation
  common/                  # Firebase helper, location schema, responses, errors
requirements.txt
.env.example
Procfile
render.yaml
```

## Firebase Realtime Database Integration

Install dependencies:

```bash
pip install Django djangorestframework firebase-admin python-dotenv django-cors-headers drf-spectacular PyJWT gunicorn whitenoise
```

The Django `DATABASES` setting intentionally uses `django.db.backends.dummy`; WorkBridge does not use SQLite or djongo. Application data is stored in Firebase Realtime Database through `apps/common/firebase_config.py`.

Required `.env` values:

```env
SECRET_KEY=<strong-django-secret>
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1,.onrender.com
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:4200

FIREBASE_DATABASE_URL=https://<your-project-id>.firebaseio.com/
FIREBASE_SERVICE_ACCOUNT_FILE=firebase-key.json

JWT_SECRET_KEY=<strong-jwt-secret>
JWT_ACCESS_TOKEN_MINUTES=60
JWT_REFRESH_TOKEN_DAYS=7
```

Firebase helper usage is available via `apps/common/firebase_config.py`, and models are defined in each app as Firebase-backed document classes.

Health check:

```text
GET /api/v1/health/
```

The response includes API status, Firebase status, selected target, and whether Firebase Realtime Database is configured.

If registration returns `database_unavailable`, Django is running but Firebase is not reachable. Set `FIREBASE_DATABASE_URL` and `FIREBASE_SERVICE_ACCOUNT_FILE` in `.env`, then restart Django.

## Local Implementation Guide

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python manage.py check_firebase_connection
python manage.py seed_demo_data --reset-demo
python manage.py create_admin_user --name Admin --email admin@workbridge.local --password StrongPass123
python manage.py runserver
```

`seed_demo_data` creates demo data in Firebase Realtime Database for a worker, employer, admin, open job, completed job, application, and rating.

For production, configure the same environment variables on Render, Railway, or AWS and run:

```bash
gunicorn workbridge.wsgi:application
```

Render notes:

- Set build command: `pip install -r requirements.txt`
- Set start command: `gunicorn workbridge.wsgi:application`
- Add env vars from `.env.example`, especially `FIREBASE_DATABASE_URL`, `FIREBASE_SERVICE_ACCOUNT_FILE`, `SECRET_KEY`, `JWT_SECRET_KEY`, `DEBUG=False`, and `ALLOWED_HOSTS=.onrender.com`.

Railway notes:

- Add the same env vars in the Railway service variables UI.
- Use start command `gunicorn workbridge.wsgi:application`.

Firebase testing:

```bash
python manage.py check_firebase_connection
python manage.py seed_demo_data --reset-demo
```

Then verify demo data in Firebase Realtime Database.

Best practices:

- Never commit `.env` or a real Firebase service account key file.
- Use separate credentials for local, staging, and production.
- Keep `DEBUG=False` in production.
- Rotate secrets if they are exposed.

## Authentication Flow

All protected endpoints use:

```http
Authorization: Bearer <access_token>
```

In Swagger, first call a login/register endpoint, copy `data.tokens.access`, click **Authorize**, and paste only the JWT value. Swagger will send `Authorization: Bearer <token>` for protected worker, employer, recommendation, notification, and admin APIs.

JWT payload includes `sub`, `role`, `type`, `iat`, and `exp`. Passwords are hashed with Django's password hasher. OTP/mobile/email login hooks are present at `/api/v1/auth/otp/start/` and `/api/v1/auth/otp/verify/`; wire these to a provider such as Twilio, MSG91, Firebase Auth, or AWS SNS.

## API Endpoints

Authentication:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/v1/auth/worker-register/` | Worker registration |
| POST | `/api/v1/auth/worker-login/` | Worker login |
| POST | `/api/v1/auth/employer-register/` | Employer registration |
| POST | `/api/v1/auth/employer-login/` | Employer login |
| POST | `/api/v1/auth/admin-login/` | Admin login |
| POST | `/api/v1/auth/refresh/` | Refresh JWT tokens |
| POST | `/api/v1/auth/workers/register/` | Worker registration |
| POST | `/api/v1/auth/workers/login/` | Worker login |
| POST | `/api/v1/auth/employers/register/` | Employer registration |
| POST | `/api/v1/auth/employers/login/` | Employer login |
| POST | `/api/v1/auth/admin/login/` | Admin login |
| POST | `/api/v1/auth/token/refresh/` | Refresh JWT tokens |
| POST | `/api/v1/auth/otp/start/` | OTP provider hook |
| POST | `/api/v1/auth/otp/verify/` | OTP verification hook |

Worker:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET/PUT | `/api/v1/workers/profile/` | View/create/update worker profile |
| POST | `/api/v1/workers/skills/` | Add multiple skills |
| POST | `/api/v1/workers/certificates/` | Upload one or more certificate files |
| POST | `/api/v1/workers/availability/` | Set availability |
| POST | `/api/v1/workers/apply-job/{job_id}/` | Apply for job |
| GET | `/api/v1/workers/applied-jobs/` | Applied jobs |
| GET | `/api/v1/workers/ratings/` | Ratings/reviews |
| GET | `/api/v1/workers/notifications/` | Worker notifications |
| GET/PATCH | `/api/v1/workers/me/` | View/update profile, skills, language, location, uploads |
| PATCH | `/api/v1/workers/availability/` | Set availability |
| POST | `/api/v1/workers/need-work-today/` | Emergency work preference |
| GET | `/api/v1/workers/recommended-jobs/` | Recommended jobs |
| POST | `/api/v1/workers/jobs/{job_id}/apply/` | Apply for job |
| GET | `/api/v1/workers/applications/` | Applied jobs, filter by `?status=` |
| GET | `/api/v1/workers/completed-jobs/` | Completed jobs |
| GET | `/api/v1/workers/reviews/` | Ratings/reviews |
| GET | `/api/v1/workers/trust-score/` | Trust score and level |

Employer:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET/PUT | `/api/v1/employers/profile/` | Employer profile |
| GET/PATCH | `/api/v1/employers/me/` | Employer profile |
| GET/POST | `/api/v1/employers/jobs/` | List/post jobs |
| PATCH/DELETE | `/api/v1/employers/jobs/{job_id}/` | Edit/close jobs |
| GET | `/api/v1/employers/jobs/{job_id}/applications/` | View applications |
| POST | `/api/v1/employers/applications/{application_id}/decision/` | Accept/reject |
| POST | `/api/v1/employers/applications/{application_id}/complete/` | Mark completed |
| POST | `/api/v1/employers/applications/{application_id}/review/` | Rate worker |
| GET | `/api/v1/employers/nearby-workers/` | Nearby available workers |
| GET | `/api/v1/employers/jobs/{job_id}/recommended-workers/` | Recommended workers |
| GET | `/api/v1/employers/workers/{worker_id}/trust-score/` | Worker trust lookup |

Jobs and recommendations:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/v1/jobs/?skill=plumbing&search=pump&page=1&page_size=20` | Public job listing |
| POST | `/api/v1/jobs/create/` | Employer posts a job |
| PUT | `/api/v1/jobs/update/{job_id}/` | Employer edits a job |
| DELETE | `/api/v1/jobs/delete/{job_id}/` | Employer closes/deletes a job |
| GET | `/api/v1/jobs/my-jobs/` | Employer posted jobs |
| GET | `/api/v1/jobs/applicants/{job_id}/` | Employer views applicants |
| POST | `/api/v1/jobs/accept/{application_id}/` | Accept application |
| POST | `/api/v1/jobs/reject/{application_id}/` | Reject application |
| POST | `/api/v1/jobs/complete/{job_id}/` | Complete accepted job |
| POST | `/api/v1/jobs/rate-worker/{worker_id}/` | Rate worker after completion |
| GET | `/api/v1/jobs/nearby/?latitude=17.4&longitude=78.4&max_distance_km=25` | Nearby jobs |
| GET | `/api/v1/jobs/search/?search=pump` | Search jobs |
| GET | `/api/v1/jobs/filter/?skill=plumbing&min_salary=500&urgency=urgent` | Filter jobs |
| GET | `/api/v1/jobs/{job_id}/` | Public job detail |
| GET | `/api/v1/recommendations/jobs/` | Worker job recommendations |
| GET | `/api/v1/recommendations/workers/?job_id={job_id}` | Employer worker recommendations |
| GET | `/api/v1/recommendations/jobs/for-worker/` | Worker recommendation endpoint |
| GET | `/api/v1/recommendations/workers/for-job/{job_id}/` | Employer recommendation endpoint |

Admin and notifications:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/v1/admin/workers/` | View all workers |
| GET | `/api/v1/admin/employers/` | View all employers |
| POST | `/api/v1/admin/block-user/{user_id}/` | Block/unblock user |
| DELETE | `/api/v1/admin/remove-job/{job_id}/` | Remove fake job |
| GET | `/api/v1/admin/dashboard/` | Dashboard analytics |
| GET | `/api/v1/admin/users/` | View users |
| PATCH | `/api/v1/admin/users/{user_id}/block/` | Block/unblock |
| DELETE | `/api/v1/admin/jobs/{job_id}/remove/` | Remove fake jobs |
| GET/POST | `/api/v1/admin/complaints/` | View/create reports |
| PATCH | `/api/v1/admin/complaints/{complaint_id}/` | Handle report |
| GET | `/api/v1/admin/ratings/` | Monitor ratings |
| GET | `/api/v1/admin/analytics/` | Dashboard analytics |
| GET | `/api/v1/admin/fraud-monitoring/` | Fraud signals |
| GET | `/api/v1/notifications/` | User notifications |
| PATCH | `/api/v1/notifications/{notification_id}/read/` | Mark read |

## Sample Requests

Worker registration:

```json
{
  "name": "Sita Devi",
  "phone": "+919999999999",
  "email": "sita@example.com",
  "password": "StrongPass123"
}
```

Job posting:

```json
{
  "title": "Farm irrigation pump repair",
  "description": "Need help repairing a pump today.",
  "required_skills": ["pump repair", "electrical basics"],
  "salary": 1200,
  "location": {
    "village": "Rampur",
    "district": "Nalgonda",
    "state": "Telangana",
    "latitude": 17.0575,
    "longitude": 79.2674
  },
  "duration": "1 day",
  "urgency": "emergency",
  "worker_level_required": "Beginner"
}
```

Recommendation response:

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "results": [
      {
        "id": "66b...",
        "title": "Farm irrigation pump repair",
        "required_skills": ["pump repair", "electrical basics"],
        "salary": 1200,
        "worker_level_required": "Beginner",
        "recommendation_score": 78.25,
        "distance_km": 6.4
      }
    ]
  }
}
```

## Recommendation Workflow

Initial scoring is rule-based and transparent:

```text
Recommendation Score =
Skill Match up to 40
+ Distance Match up to 25
+ Trust Score contribution up to 25
+ Availability Match 10
+ Emergency Match 8 when applicable
```

Worker levels are based on completed jobs only:

```text
Beginner: 0-3 completed jobs
Intermediate: 4-10 completed jobs
Senior: 11+ completed jobs
```

The recommendation module already imports scikit-learn and includes a cosine-similarity helper. Later, you can replace or enrich the rule score with KNN, content similarity, collaborative filtering, or a learned ranking model while keeping the API contract stable.

## Trust Score Workflow

Trust score intentionally avoids relying on self-entered experience:

```text
completed_jobs_component = min(completed_jobs_count * 4, 35)
rating_component = average_rating / 5 * 30
consistency_component = consistency_score * 0.20
verification_component = skill_verification_score * 0.15
```

When an employer marks work completed, the worker's completed job count increases. When a review is submitted, ratings and trust score are recalculated. Skill verification tests can update `skill_verification_score` later without changing the trust API.

## API Conventions

Responses use:

```json
{
  "success": true,
  "message": "OK",
  "data": {}
}
```

Common status codes:

```text
200 OK
201 Created
400 Validation error
401 Missing/invalid/expired token
403 Role or ownership denied
404 Resource not found
```

Pagination is implemented on public job listing through `page` and `page_size`. Search and filtering begin with `skill`, `search`, `urgency`, `status`, and `max_distance_km`; expand these into shared pagination/filter helpers as the API grows.
