from apps.common.documents import Location, utcnow
from apps.jobs.documents import JobApplication
from apps.workers.documents import WorkerProfile


def create_worker_profile(user, location=None):
    profile = WorkerProfile.objects(user=user).first()
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
    return WorkerProfile(user=user, **profile_attrs).save()


def get_worker_profile(user):
    from apps.workers.documents import WorkerProfile
    if isinstance(user.document, WorkerProfile):
        return user.document
    profile = WorkerProfile.objects(user=user.document).first()
    if profile:
        profile.name = user.document.name
        profile.phone = user.document.phone
        profile.email = user.document.email
        profile.role = user.document.role
        profile.password_hash = user.document.password_hash
        profile.is_active = user.document.is_active
        profile.is_blocked = user.document.is_blocked
        return profile.save()
    return WorkerProfile(user=user.document, name=user.document.name, phone=user.document.phone, email=user.document.email, role=user.document.role, password_hash=user.document.password_hash, is_active=user.document.is_active, is_blocked=user.document.is_blocked).save()


def calculate_worker_level(completed_jobs_count):
    if completed_jobs_count < 5:
        return "Beginner"
    if completed_jobs_count < 15:
        return "Intermediate"
    return "Experienced"


def calculate_trust_score(worker):
    completed_component = min(worker.completed_jobs_count * 4, 35)
    rating_component = (worker.average_rating / 5) * 30 if worker.average_rating else 0
    consistency_component = min(worker.consistency_score, 100) * 0.2
    verification_component = min(worker.skill_verification_score, 100) * 0.15
    return round(completed_component + rating_component + consistency_component + verification_component, 2)


def update_trust_score(worker):
    worker.trust_score = calculate_trust_score(worker)
    worker.updated_at = utcnow()
    worker.save()
    return worker.trust_score


def mark_worker_completed(worker):
    worker.completed_jobs_count += 1
    worker.need_work_today = False
    update_trust_score(worker)
    return worker


def worker_applications(worker, status=None):
    query = JobApplication.objects(worker=worker)
    return query.filter(status=status) if status else query
