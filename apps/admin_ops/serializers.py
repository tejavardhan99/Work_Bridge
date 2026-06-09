from rest_framework import serializers


class BlockUserSerializer(serializers.Serializer):
    is_blocked = serializers.BooleanField()


class ComplaintStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=("open", "reviewing", "resolved", "dismissed"))


class FraudReportSerializer(serializers.Serializer):
    reason = serializers.CharField()
    details = serializers.CharField(required=False, allow_blank=True)
    reported_user_id = serializers.CharField(required=False, allow_blank=True)
    job_id = serializers.CharField(required=False, allow_blank=True)
