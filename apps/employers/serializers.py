from rest_framework import serializers

from apps.jobs.serializers import serialize_location


ALLOWED_LOCATIONS = ['Duvvada', 'Gajuwaka']


class EmployerProfileSerializer(serializers.Serializer):
    name = serializers.CharField(required=False, allow_blank=True, max_length=120)
    phone = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    organization_name = serializers.CharField(required=False, allow_blank=True, max_length=160)
    business_type = serializers.CharField(required=False, allow_blank=True, max_length=120)
    location = serializers.CharField(required=False, allow_blank=True)

    def validate_location(self, value):
        if value and value not in ALLOWED_LOCATIONS:
            raise serializers.ValidationError(f'Invalid location selected. Allowed locations: {", ".join(ALLOWED_LOCATIONS)}')
        return value or ""


def serialize_employer(employer):
    return {
        "id": str(employer.id),
        "user_id": str(employer.user.id),
        "name": employer.user.name,
        "phone": employer.user.phone,
        "email": employer.user.email,
        "organization_name": employer.organization_name,
        "business_type": employer.business_type,
        "location": serialize_location(employer.location),
    }
