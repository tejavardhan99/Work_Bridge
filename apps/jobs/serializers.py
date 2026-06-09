from rest_framework import serializers

from apps.common.documents import Location
from apps.jobs.documents import Review


class LocationSerializer(serializers.Serializer):
    address = serializers.CharField(required=False, allow_blank=True)
    village = serializers.CharField(required=False, allow_blank=True)
    district = serializers.CharField(required=False, allow_blank=True)
    state = serializers.CharField(required=False, allow_blank=True)

    ALLOWED_LOCATIONS = {'Duvvada', 'Gajuwaka'}

    def validate(self, data):
        address = (data.get('address') or '').strip()
        village = (data.get('village') or '').strip()

        if address not in self.ALLOWED_LOCATIONS:
            raise serializers.ValidationError({
                'address': 'Invalid location. Choose Duvvada or Gajuwaka.',
            })
        if village not in self.ALLOWED_LOCATIONS:
            raise serializers.ValidationError({
                'village': 'Invalid location. Choose Duvvada or Gajuwaka.',
            })

        data['district'] = 'Visakhapatnam'
        data['state'] = 'Andhra Pradesh'
        return data

    def to_location(self):
        return Location(**self.validated_data)


class JobSerializer(serializers.Serializer):
    ALLOWED_DURATIONS = (
        'Flexible',
        '1 day',
        '2 days',
        '3 days',
        '5 days',
        '1 week',
        '2 weeks',
        '1 month',
        '3 months',
    )

    title = serializers.CharField(max_length=160)
    description = serializers.CharField()
    required_skills = serializers.ListField(child=serializers.CharField(max_length=80), allow_empty=False)
    salary = serializers.FloatField(min_value=0)
    location = LocationSerializer()
    duration = serializers.ChoiceField(choices=ALLOWED_DURATIONS, default='Flexible')
    urgency = serializers.ChoiceField(choices=("normal", "urgent", "emergency"), default="normal")
    worker_level_required = serializers.ChoiceField(choices=("Beginner", "Intermediate", "Experienced"), default="Beginner")
    openings = serializers.IntegerField(min_value=1, max_value=100, default=1)


class JobQuerySerializer(serializers.Serializer):
    page = serializers.IntegerField(min_value=1, required=False, default=1)
    page_size = serializers.IntegerField(min_value=1, max_value=1000, required=False, default=1000)
    search = serializers.CharField(required=False, allow_blank=True)
    skill = serializers.CharField(required=False, allow_blank=True)
    skills = serializers.CharField(required=False, allow_blank=True)
    urgency = serializers.ChoiceField(choices=("normal", "urgent", "emergency"), required=False)
    duration = serializers.CharField(required=False, allow_blank=True)
    min_salary = serializers.FloatField(min_value=0, required=False)
    max_salary = serializers.FloatField(min_value=0, required=False)
    village = serializers.CharField(required=False, allow_blank=True)
    district = serializers.CharField(required=False, allow_blank=True)
    state = serializers.CharField(required=False, allow_blank=True)
    worker_level_required = serializers.ChoiceField(choices=("Beginner", "Intermediate", "Experienced"), required=False)


class NearbyJobsQuerySerializer(serializers.Serializer):
    village = serializers.CharField(required=False, allow_blank=True)
    district = serializers.CharField(required=False, allow_blank=True)
    state = serializers.CharField(required=False, allow_blank=True)
    skills = serializers.CharField(required=False, allow_blank=True)
    page = serializers.IntegerField(min_value=1, required=False, default=1)
    page_size = serializers.IntegerField(min_value=1, max_value=1000, required=False, default=1000)


class ApplicationSerializer(serializers.Serializer):
    cover_note = serializers.CharField(required=False, allow_blank=True)


class ApplicationDecisionSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=("accepted", "rejected"))


class ReviewSerializer(serializers.Serializer):
    rating = serializers.IntegerField(min_value=1, max_value=5)
    comment = serializers.CharField(required=False, allow_blank=True)


class WorkerRatingSerializer(serializers.Serializer):
    job_id = serializers.CharField()
    rating = serializers.IntegerField(min_value=1, max_value=5)
    comment = serializers.CharField(required=False, allow_blank=True)


from datetime import datetime

def serialize_job(job, score=None, distance_km=None):
    from apps.jobs.documents import JobApplication
    try:
        applications_count = JobApplication.objects(job=job).count()
    except Exception:
        applications_count = 0

    employer_name = "Employer"
    if job.employer:
        try:
            if getattr(job.employer, "organization_name", None):
                employer_name = job.employer.organization_name
            elif getattr(job.employer, "name", None):
                employer_name = job.employer.name
            elif getattr(job.employer, "user", None) and getattr(job.employer.user, "name", None):
                employer_name = job.employer.user.name
        except Exception:
            pass

    data = {
        "id": str(job.id) if hasattr(job, "id") else "",
        "title": getattr(job, "title", ""),
        "description": getattr(job, "description", ""),
        "required_skills": getattr(job, "required_skills", []) or [],
        "salary": getattr(job, "salary", 0) or 0,
        "location": serialize_location(getattr(job, "location", None)),
        "duration": getattr(job, "duration", ""),
        "urgency": getattr(job, "urgency", "normal") or "normal",
        "worker_level_required": getattr(job, "worker_level_required", "Beginner") or "Beginner",
        "status": getattr(job, "status", "open"),
        "openings": getattr(job, "openings", 1) or 1,
        "filled_openings": getattr(job, "filled_openings", 0) or 0,
        "remaining_openings": max(0, (getattr(job, "openings", 1) or 1) - (getattr(job, "filled_openings", 0) or 0)),
        "employer_id": getattr(job, "employer_id", None),
        "employer_name": employer_name,
        "applications_count": applications_count,
        "created_at": getattr(job, "created_at", None),
    }
    if score is not None:
        data["recommendation_score"] = score
    if distance_km is not None:
        data["distance_km"] = round(distance_km, 2)
    return data


def serialize_location(location):
    if not location:
        return {
            "address": "",
            "village": "",
            "district": "",
            "state": "",
        }

    try:
        if isinstance(location, str):
            return {
                "address": location,
                "village": location,
                "district": "",
                "state": "",
            }

        if isinstance(location, dict):
            return {
                "address": location.get("address") or location.get("location") or "",
                "village": location.get("village") or "",
                "district": location.get("district") or "",
                "state": location.get("state") or "",
            }

        return {
            "address": getattr(location, "address", "") or "",
            "village": getattr(location, "village", "") or "",
            "district": getattr(location, "district", "") or "",
            "state": getattr(location, "state", "") or "",
        }
    except Exception:
        return {
            "address": "",
            "village": "",
            "district": "",
            "state": "",
        }


def serialize_application(application):
    worker_skills = getattr(application, "worker_skills", [])
    if not worker_skills and application.worker:
        worker_skills = getattr(application.worker, "skills", [])

    worker_location = getattr(application, "worker_location", None)
    if not worker_location and application.worker and application.worker.location:
        worker_location = serialize_location(application.worker.location)
    elif isinstance(worker_location, dict):
        pass
    elif worker_location:
        worker_location = serialize_location(worker_location)

    worker_rating = 0
    if application.worker:
        worker_rating = getattr(application.worker, "average_rating", 0)

    worker_completed_jobs = 0
    if application.worker:
        worker_completed_jobs = getattr(application.worker, "completed_jobs_count", 0)

    worker_phone = getattr(application, "worker_phone", "")
    if not worker_phone and application.worker:
        worker_phone = getattr(application.worker, "phone", "")
        if not worker_phone and application.worker.user:
            worker_phone = getattr(application.worker.user, "phone", "")

    worker_name = getattr(application, "worker_name", "")
    if not worker_name and application.worker:
        worker_name = getattr(application.worker, "name", "")
        if not worker_name and application.worker.user:
            worker_name = getattr(application.worker.user, "name", "")

    applied_at_val = getattr(application, "applied_at", None)
    if not applied_at_val:
        if isinstance(application.created_at, datetime):
            applied_at_val = application.created_at.isoformat()
        else:
            applied_at_val = str(application.created_at)

    return {
        "id": str(application.id),
        "job": serialize_job(application.job) if application.job else None,
        "job_id": getattr(application, "job_id", None) or (str(application.job.id) if application.job else None),
        "job_title": getattr(application, "job_title", None) or (application.job.title if application.job else ""),
        "employer_id": getattr(application, "employer_id", None) or (str(application.job.employer.id) if application.job and application.job.employer else None),
        "worker_id": getattr(application, "worker_id", None) or (str(application.worker.id) if application.worker else None),
        "worker_name": worker_name,
        "worker_phone": worker_phone,
        "worker_skills": worker_skills,
        "worker_location": worker_location,
        "worker_rating": worker_rating,
        "worker_completed_jobs": worker_completed_jobs,
        "status": application.status,
        "cover_note": application.cover_note,
        "applied_at": applied_at_val,
        "created_at": application.created_at,
        "reviewed": bool(Review.objects(job=application.job, worker=application.worker, employer=application.job.employer).first()) if getattr(application, 'job', None) and getattr(application, 'worker', None) else False,
    }
