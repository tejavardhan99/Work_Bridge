from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError

from apps.common.documents import utcnow
from apps.common.geo import haversine_km
from apps.jobs.documents import Job, JobApplication, Review
from apps.notifications.services import create_notification
from apps.workers.services import mark_worker_completed, update_trust_score


def create_job(employer, data):
    location = data.pop("location")
    return Job(
        employer=employer,
        employer_id=str(employer.id),
        location=location,
        **data,
    ).save()


def update_job(job, data):
    for key, value in data.items():
        setattr(job, key, value)
    job.updated_at = utcnow()
    return job.save()


def get_job_or_404(job_id):
    job = Job.objects(id=job_id).first()
    if not job:
        raise NotFound("Job not found.")
    return job


def get_application_or_404(application_id):
    application = JobApplication.objects(id=application_id).first()
    if not application:
        raise NotFound("Application not found.")
    return application


def ensure_employer_owns_job(employer, job):
    if str(job.employer.id) != str(employer.id):
        raise PermissionDenied("You do not own this job.")


def apply_for_job(worker, job, cover_note=""):
    if job.status != Job.STATUS_OPEN:
        raise ValidationError({"job": "Job is not open."})
    existing = JobApplication.objects(worker=worker, job=job).first()
    if existing:
        raise ValidationError({"application": "Already applied for this job."})
    application = JobApplication(worker=worker, job=job, cover_note=cover_note).save()
    create_notification(job.employer.user, "New job application", f"{worker.user.name} applied for {job.title}.", "application")
    return application


def decide_application(employer, application_id, status):
    application = get_application_or_404(application_id)
    ensure_employer_owns_job(employer, application.job)
    job = application.job
    if job.status != Job.STATUS_OPEN:
        raise ValidationError({"job": "Job is not open."})
    if status == JobApplication.STATUS_ACCEPTED:
        current_filled = getattr(job, "filled_openings", 0) or 0
        total_openings = getattr(job, "openings", 1) or 1
        if current_filled >= total_openings:
            raise ValidationError({"job": "All openings are filled."})
        current_filled += 1
        job.filled_openings = current_filled
        if current_filled >= total_openings:
            job.status = Job.STATUS_CLOSED
        job.updated_at = utcnow()
        job.save()

    application.status = status
    application.updated_at = utcnow()
    application.save()

    if status == JobApplication.STATUS_ACCEPTED and getattr(job, "filled_openings", 0) >= getattr(job, "openings", 1):
        JobApplication.objects(job=job, status=JobApplication.STATUS_PENDING, id__ne=application.id).update(status=JobApplication.STATUS_REJECTED, updated_at=utcnow())

    create_notification(application.worker.user, "Application updated", f"Your application for {application.job.title} was {status}.", "application")
    return application


def complete_work(employer, application_id):
    application = get_application_or_404(application_id)
    ensure_employer_owns_job(employer, application.job)
    # only allow completion for in-progress applications
    if application.status != JobApplication.STATUS_IN_PROGRESS:
        raise ValidationError({"application": "Only in-progress applications can be completed."})
    application.status = JobApplication.STATUS_COMPLETED
    application.updated_at = utcnow()
    application.save()
    mark_worker_completed(application.worker)
    create_notification(application.worker.user, "Work completed", f"{application.job.title} was marked completed.", "trust")
    return application


def start_work(employer, application_id):
    application = get_application_or_404(application_id)
    ensure_employer_owns_job(employer, application.job)
    if application.status != JobApplication.STATUS_ACCEPTED:
        raise ValidationError({"application": "Only accepted applications can be started."})
    application.status = JobApplication.STATUS_IN_PROGRESS
    application.updated_at = utcnow()
    application.save()
    # Optionally update job assigned worker (already set at accept)
    create_notification(application.worker.user, "Work started", f"{application.job.title} has been started.", "trust")
    return application


def complete_job_by_job_id(employer, job_id):
    job = get_job_or_404(job_id)
    ensure_employer_owns_job(employer, job)
    application = JobApplication.objects(job=job, status=JobApplication.STATUS_IN_PROGRESS).first()
    if not application:
        raise ValidationError({"application": "No accepted application found for this job."})
    return complete_work(employer, str(application.id))


def create_review(employer, application_id, created_by, rating, comment=""):
    application = get_application_or_404(application_id)
    ensure_employer_owns_job(employer, application.job)
    if application.status != JobApplication.STATUS_COMPLETED:
        raise ValidationError({"application": "Review is allowed after completion."})
    if Review.objects(job=application.job, worker=application.worker, employer=employer).first():
        raise ValidationError({"rating": "This worker has already been rated for this job."})
    review = Review(job=application.job, worker=application.worker, employer=employer, rating=rating, comment=comment, created_by=created_by).save()
    # append numeric rating and structured review to worker profile
    try:
        application.worker.ratings.append(rating)
    except Exception:
        application.worker.ratings = [rating]

    # add review entry to worker.reviews with necessary metadata
    try:
        review_entry = {
            "id": str(review.id),
            "rating": rating,
            "review": comment,
            "employer_name": employer.user.name if getattr(employer, 'user', None) and getattr(employer.user, 'name', None) else getattr(employer, 'organization_name', '') or getattr(employer, 'name', ''),
            "job_id": str(application.job.id) if application.job else None,
            "created_at": review.created_at,
        }
        if not getattr(application.worker, 'reviews', None):
            application.worker.reviews = []
        application.worker.reviews.append(review_entry)
    except Exception as e:
        print(f"Failed to append review entry to worker profile: {e}")

    # update worker's computed rating and trust score
    try:
        application.worker.rating = round(sum(application.worker.ratings) / len(application.worker.ratings), 2) if application.worker.ratings else 0
    except Exception:
        application.worker.rating = 0

    update_trust_score(application.worker)
    create_notification(application.worker.user, "New rating received", f"You received {rating}/5 for {application.job.title}.", "trust")
    return review


def rate_worker_for_job(employer, worker, job_id, created_by, rating, comment=""):
    job = get_job_or_404(job_id)
    ensure_employer_owns_job(employer, job)
    application = JobApplication.objects(job=job, worker=worker, status=JobApplication.STATUS_COMPLETED).first()
    if not application:
        raise ValidationError({"application": "Worker can be rated only after completing this employer's job."})
    return create_review(employer, str(application.id), created_by, rating, comment)


def apply_job_filters(query, filters):
    search = filters.get("search")
    skill = filters.get("skill")
    skills = filters.get("skills")
    urgency = filters.get("urgency")
    duration = filters.get("duration")
    min_salary = filters.get("min_salary")
    max_salary = filters.get("max_salary")
    village = filters.get("village")
    district = filters.get("district")
    state = filters.get("state")
    worker_level_required = filters.get("worker_level_required")

    if search:
        query = query.filter(title__icontains=search)
    if skill:
        query = query.filter(required_skills__iexact=skill)
    if skills:
        for item in [value.strip() for value in skills.split(",") if value.strip()]:
            query = query.filter(required_skills__iexact=item)
    if urgency:
        query = query.filter(urgency=urgency)
    if duration:
        query = query.filter(duration__icontains=duration)
    if min_salary is not None:
        query = query.filter(salary__gte=min_salary)
    if max_salary is not None:
        query = query.filter(salary__lte=max_salary)
    if village:
        query = query.filter(location__village__icontains=village)
    if district:
        query = query.filter(location__district__icontains=district)
    if state:
        query = query.filter(location__state__icontains=state)
    if worker_level_required:
        query = query.filter(worker_level_required=worker_level_required)
    return query


def paginate_query(query, page=1, page_size=20):
    total = query.count()
    items = query.skip((page - 1) * page_size).limit(page_size)
    return total, items


def nearby_jobs(village=None, district=None, state=None, skills=None):
    """
    Find jobs that match the provided human-readable location and optional skills list.
    Returns a list of (job, score) sorted by score descending.
    Handles missing/None Firebase fields safely.
    """
    matches = []
    skill_list = []
    
    # Safely process skills parameter
    try:
        if skills:
            if isinstance(skills, str):
                skill_list = [s.strip().lower() for s in skills.split(",") if s.strip()]
            elif isinstance(skills, (list, tuple)):
                skill_list = [s.strip().lower() for s in skills if s]
    except Exception as e:
        print(f"Error processing skills: {str(e)}")
        skill_list = []

    try:
        jobs_queryset = Job.objects(status=Job.STATUS_OPEN).order_by("-created_at")
        if not jobs_queryset:
            return []
        
        for job in jobs_queryset:
            try:
                score = 0
                
                # Safely get required_skills
                req = []
                try:
                    job_skills = job.required_skills or []
                    if isinstance(job_skills, (list, tuple)):
                        req = [s.lower().strip() for s in job_skills if s]
                except Exception as e:
                    print(f"Error processing job skills for job {job.id if hasattr(job, 'id') else 'unknown'}: {str(e)}")
                    req = []
                
                # Skills match: proportion of required_skills present
                if req and skill_list:
                    common = len(set(req) & set(skill_list))
                    skill_score = (common / len(req)) * 70 if len(req) > 0 else 0
                    score += skill_score
                elif req and not skill_list:
                    score += 10

                # Safely get location and match weights
                try:
                    job_loc = job.location
                    if job_loc:
                        # Handle both Location objects and dicts
                        job_village = None
                        job_district = None
                        job_state = None
                        
                        if isinstance(job_loc, dict):
                            job_village = (job_loc.get("village") or "").strip() if job_loc.get("village") else None
                            job_district = (job_loc.get("district") or "").strip() if job_loc.get("district") else None
                            job_state = (job_loc.get("state") or "").strip() if job_loc.get("state") else None
                        else:
                            job_village = (getattr(job_loc, "village", None) or "").strip() if getattr(job_loc, "village", None) else None
                            job_district = (getattr(job_loc, "district", None) or "").strip() if getattr(job_loc, "district", None) else None
                            job_state = (getattr(job_loc, "state", None) or "").strip() if getattr(job_loc, "state", None) else None
                        
                        village_safe = (village or "").strip() if village else None
                        district_safe = (district or "").strip() if district else None
                        state_safe = (state or "").strip() if state else None
                        
                        if village_safe and job_village and job_village.lower() == village_safe.lower():
                            score += 20
                        elif district_safe and job_district and job_district.lower() == district_safe.lower():
                            score += 12
                        elif state_safe and job_state and job_state.lower() == state_safe.lower():
                            score += 6
                except Exception as e:
                    print(f"Error processing job location for job {job.id if hasattr(job, 'id') else 'unknown'}: {str(e)}")

                # Small boost for urgency
                try:
                    urgency = getattr(job, "urgency", "normal") or "normal"
                    if urgency == 'urgent':
                        score += 3
                    elif urgency == 'emergency':
                        score += 6
                except Exception as e:
                    print(f"Error processing urgency for job {job.id if hasattr(job, 'id') else 'unknown'}: {str(e)}")

                if score > 0:
                    matches.append((job, round(score, 2)))
            
            except Exception as e:
                print(f"Error processing job {job.id if hasattr(job, 'id') else 'unknown'}: {str(e)}")
                continue

        return sorted(matches, key=lambda item: item[1], reverse=True)
    
    except Exception as e:
        print(f"Error in nearby_jobs function: {str(e)}")
        import traceback
        traceback.print_exc()
        return []
