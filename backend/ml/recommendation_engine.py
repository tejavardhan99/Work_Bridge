from .scoring_rules import (
    skill_match_score,
    location_score,
    general_job_score,
    hide_unrelated_specialized,
    beginner_bonus,
    intermediate_bonus,
    expert_bonus,
    rating_bonus,
    exact_skill_match,
    is_specialized_job,
)


def calculate_score(worker, job):
    score = 0
    try:
        worker_skills = getattr(worker, 'skills', [])
        worker_location = getattr(worker, 'location', None)
        worker_completed = getattr(worker, 'completed_jobs_count', 0)
        worker_rating = getattr(worker, 'average_rating', 0) if hasattr(worker, 'average_rating') else getattr(worker, 'rating', 0)
        if not worker_rating:
            worker_rating = getattr(worker, 'rating', 0)

        job_title = job.get('title') if isinstance(job, dict) else getattr(job, 'title', '')
        job_required_skills = job.get('required_skills') if isinstance(job, dict) else getattr(job, 'required_skills', [])
        job_location = job.get('location') if isinstance(job, dict) else getattr(job, 'location', None)
        job_worker_level = job.get('worker_level_required') if isinstance(job, dict) else getattr(job, 'worker_level_required', None)

        # Rule 4 - hide unrelated specialized jobs
        if hide_unrelated_specialized(worker_skills, job_title, job_required_skills):
            return None  # indicate job should be excluded

        # Same Location (+100) or Different Location (-50)
        loc_score = location_score(worker_location, job_location)
        score += loc_score

        # Skill Match (+80)
        sk_score = skill_match_score(worker_skills, job_required_skills, job_title)
        score += sk_score

        # General Job (+20)
        gen_score = general_job_score(job_title)
        score += gen_score

        # Beginner Job + Beginner Worker (+30)
        beg_score = beginner_bonus(worker_completed, job_worker_level)
        score += beg_score

        # Intermediate Job + Intermediate Worker (+30)
        int_score = intermediate_bonus(worker_completed, job_worker_level)
        score += int_score

        # Expert Job + Expert Worker (+30)
        exp_score = expert_bonus(worker_completed, worker_rating, job_worker_level)
        score += exp_score

        # High Rating Bonus (+10)
        rat_score = rating_bonus(worker_rating)
        score += rat_score
    except Exception as e:
        print('Error calculating score:', str(e))
        return None

    return score

