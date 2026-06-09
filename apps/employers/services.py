from apps.common.documents import Location
from apps.employers.documents import EmployerProfile


def create_employer_profile(user, location=None):
    profile = EmployerProfile.objects(user=user).first()
    profile_attrs = {
        "name": user.name,
        "phone": user.phone,
        "email": user.email,
        "role": user.role,
        "password_hash": user.password_hash,
        "is_active": user.is_active,
        "is_blocked": user.is_blocked,
    }
    if location:
        profile_attrs["location"] = Location(address=location)

    if profile:
        for key, value in profile_attrs.items():
            setattr(profile, key, value)
        return profile.save()
    return EmployerProfile(user=user, **profile_attrs).save()


def get_employer_profile(user):
    from apps.employers.documents import EmployerProfile
    if isinstance(user.document, EmployerProfile):
        return user.document
    profile = EmployerProfile.objects(user=user.document).first()
    if profile:
        profile.name = user.document.name
        profile.phone = user.document.phone
        profile.email = user.document.email
        profile.role = user.document.role
        profile.password_hash = user.document.password_hash
        profile.is_active = user.document.is_active
        profile.is_blocked = user.document.is_blocked
        return profile.save()
    return EmployerProfile(user=user.document, name=user.document.name, phone=user.document.phone, email=user.document.email, role=user.document.role, password_hash=user.document.password_hash, is_active=user.document.is_active, is_blocked=user.document.is_blocked).save()
