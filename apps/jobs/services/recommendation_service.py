from types import SimpleNamespace

from apps.jobs.documents import Job
from apps.recommendations.services import recommend_jobs_for_worker as recommend_jobs_for_worker_by_profile
from apps.workers.services import get_worker_profile
from apps.common.documents import Location
from backend.ml.recommendation_engine import calculate_score


def recommend_jobs_for_worker(user):
    worker = get_worker_profile(user)
    return recommend_jobs_for_worker_by_profile(worker)


def nearby_jobs_for_query(village=None, district=None, state=None, skills=None):
    """Score open jobs against a search query using the recommendation engine."""
    worker = SimpleNamespace()

    if isinstance(skills, str):
        worker.skills = [skill.strip() for skill in skills.split(",") if skill.strip()]
    elif isinstance(skills, (list, tuple)):
        worker.skills = [skill.strip() for skill in skills if isinstance(skill, str) and skill.strip()]
    else:
        worker.skills = []

    worker.location = Location(village=village or "", district=district or "", state=state or "")
    worker.completed_jobs_count = 0
    worker.average_rating = 0
    worker.rating = 0
    worker.level = "Beginner"

    matches = []
    for job in Job.objects(status=Job.STATUS_OPEN):
        score = calculate_score(worker, job)
        if score is None or score <= 0:
            continue
        matches.append((job, round(score, 2)))

    return sorted(matches, key=lambda item: item[1], reverse=True)
