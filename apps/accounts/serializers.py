from rest_framework import serializers

ALLOWED_LOCATIONS = ['Duvvada', 'Gajuwaka']


class RegisterSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=120)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    password = serializers.CharField(min_length=8, write_only=True)
    location = serializers.CharField()

    def validate_location(self, location):
        if location not in ALLOWED_LOCATIONS:
            raise serializers.ValidationError('Invalid location selected.')
        return location


class AuthIndexSerializer(serializers.Serializer):
    worker_register = serializers.CharField()
    worker_login = serializers.CharField()
    employer_register = serializers.CharField()
    employer_login = serializers.CharField()
    admin_login = serializers.CharField()
    refresh = serializers.CharField()
    demo_tokens = serializers.CharField()
    note = serializers.CharField()


class DemoTokensSerializer(serializers.Serializer):
    worker = serializers.DictField()
    employer = serializers.DictField()
    admin = serializers.DictField()


class LoginSerializer(serializers.Serializer):
    identifier = serializers.CharField()
    password = serializers.CharField(write_only=True)


class RefreshSerializer(serializers.Serializer):
    refresh = serializers.CharField()
