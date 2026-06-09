from rest_framework import serializers

from apps.jobs.serializers import serialize_location


ALLOWED_LOCATIONS = ['Duvvada', 'Gajuwaka']


class WorkerProfileSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=120, required=False)
    phone = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    location = serializers.CharField(required=False, allow_blank=True)
    skills = serializers.ListField(child=serializers.CharField(max_length=80), required=False)
    languages = serializers.ListField(child=serializers.CharField(max_length=50), required=False)
    availability = serializers.BooleanField(required=False)
    experience = serializers.CharField(required=False, allow_blank=True)
    profile_image = serializers.FileField(required=False)
    certificates = serializers.ListField(child=serializers.FileField(), required=False)

    def validate_location(self, value):
        if isinstance(value, dict):
            value = value.get("address", "")
        if value and value not in ALLOWED_LOCATIONS:
            raise serializers.ValidationError(f'Invalid location selected. Allowed locations: {", ".join(ALLOWED_LOCATIONS)}')
        return value or ""


class WorkerSkillsSerializer(serializers.Serializer):
    skills = serializers.ListField(child=serializers.CharField(max_length=80), allow_empty=False)


class CertificateUploadSerializer(serializers.Serializer):
    certificates = serializers.ListField(child=serializers.FileField(), required=False)


class AvailabilitySerializer(serializers.Serializer):
    availability = serializers.BooleanField()


class NeedWorkTodaySerializer(serializers.Serializer):
    enabled = serializers.BooleanField(default=True)


def serialize_worker(worker, score=None, distance_km=None):
    data = {
        "id": str(worker.id),
        "user_id": str(worker.user.id),
        "name": worker.user.name,
        "phone": worker.user.phone,
        "location": serialize_location(worker.location),
        "skills": worker.skills,
        "completed_jobs_count": worker.completed_jobs_count,
        "average_rating": worker.average_rating,
        "ratings": worker.ratings,
        "trust_score": worker.trust_score,
        "level": worker.level,
        "languages": worker.languages,
        "availability": worker.availability,
        "experience": worker.experience,
        "profile_image": worker.profile_image,
        "certificates": worker.certificates,
        "need_work_today": worker.need_work_today,
    }
    if score is not None:
        data["recommendation_score"] = score
    if distance_km is not None:
        data["distance_km"] = round(distance_km, 2)
    return data
