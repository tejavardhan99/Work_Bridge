from rest_framework import serializers


class EmptySerializer(serializers.Serializer):
    pass


class HealthDatabaseSerializer(serializers.Serializer):
    connected = serializers.BooleanField()
    status = serializers.CharField()
    database = serializers.CharField()
    target = serializers.CharField()
    error = serializers.CharField(required=False, allow_blank=True)


class HealthResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    message = serializers.CharField()
    database = HealthDatabaseSerializer()


class HealthErrorResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    status_code = serializers.IntegerField()
    error = serializers.DictField()
