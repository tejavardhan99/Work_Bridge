from apps.jobs.documents import Job
from apps.workers.documents import WorkerProfile
from backend.ml.recommendation_engine import calculate_score

LEVEL_RANK = {'Beginner': 1, 'Intermediate': 2, 'Experienced': 3}

def distance_score(distance_km, max_distance_km=50):
    # Deprecated when geographic coordinates are not available; keep for compatibility
    if distance_km is None:
        return 0
    if distance_km > max_distance_km:
        return 0
    return (1 - (distance_km / max_distance_km)) * 25

def level_allowed(worker_level, required_level, completed_jobs_count=None, rating=None):
    if completed_jobs_count is not None:
        if completed_jobs_count < 5:
            actual_level = "Beginner"
        elif completed_jobs_count < 15:
            actual_level = "Intermediate"
        elif rating is not None and rating >= 4:
            actual_level = "Experienced"
        else:
            actual_level = "Intermediate"
    else:
        actual_level = worker_level

    # Experienced acts as Expert in the levels rank mapping
    req = required_level
    if req == "Expert":
        req = "Experienced"
    return LEVEL_RANK.get(actual_level, 1) >= LEVEL_RANK.get(req, 1)

def recommend_jobs_for_worker(worker, max_distance_km=50):
    # Fetch latest worker profile from DB to guarantee freshest profile info
    latest_worker = WorkerProfile.objects(id=worker.id).first()
    if latest_worker:
        worker = latest_worker

    scored = []
    completed_jobs_count = getattr(worker, 'completed_jobs_count', 0)
    rating = getattr(worker, 'average_rating', 0) if hasattr(worker, 'average_rating') else getattr(worker, 'rating', 0)
    if not rating:
        rating = getattr(worker, 'rating', 0)

    for job in Job.objects(status=Job.STATUS_OPEN):
        if not level_allowed(worker.level, job.worker_level_required, completed_jobs_count, rating):
            continue
        score = calculate_score(worker, job)
        if score is None:
            continue
        scored.append({'job': job, 'score': round(score, 2), 'distance_km': None})
    return sorted(scored, key=lambda item: item['score'], reverse=True)

def recommend_workers_for_job(job, max_distance_km=50):
    scored = []
    for worker in WorkerProfile.objects(availability=True):
        completed_jobs_count = getattr(worker, 'completed_jobs_count', 0)
        rating = getattr(worker, 'average_rating', 0) if hasattr(worker, 'average_rating') else getattr(worker, 'rating', 0)
        if not rating:
            rating = getattr(worker, 'rating', 0)

        if not level_allowed(worker.level, job.worker_level_required, completed_jobs_count, rating):
            continue
        score = calculate_score(worker, job)
        if score is None or score <= 0:
            continue
        scored.append({'worker': worker, 'score': round(score, 2), 'distance_km': None})
    return sorted(scored, key=lambda item: item['score'], reverse=True)
