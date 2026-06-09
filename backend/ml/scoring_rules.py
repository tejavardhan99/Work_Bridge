from .general_jobs import GENERAL_JOBS, SPECIALIZED_JOBS
from .utils import normalize_text_list, location_to_string


def normalize_skill_root(text):
    if not text:
        return ""
    text = text.lower().strip()
    suffixes = [
        " technician", " operator", " industrial supervisor", " supervisor", " worker", " assistant", " engineer", 
        " er", " ian", " ing", " s",
        "technician", "operator", "industrial supervisor", "supervisor", "worker", "assistant", "engineer",
        "er", "ian", "ing", "s"
    ]
    for suffix in suffixes:
        if text.endswith(suffix):
            text = text[: -len(suffix)].strip()
    return text


def exact_skill_match(worker_skills, job_title, job_required_skills):
    worker_roots = {normalize_skill_root(skill) for skill in normalize_text_list(worker_skills) if skill}
    if not worker_roots:
        return False

    title = (job_title or "").lower()
    # Check if any worker root is in the job title
    if any(w_root in title for w_root in worker_roots):
        return True

    # Check if any worker root matches or is a substring of any job required skill
    job_skills = normalize_text_list(job_required_skills)
    for w_root in worker_roots:
        for j_skill in job_skills:
            j_skill_root = normalize_skill_root(j_skill)
            if w_root in j_skill_root or j_skill_root in w_root:
                return True
                
    return False


def skill_match_score(worker_skills, job_skills, job_title=None):
    if exact_skill_match(worker_skills, job_title, job_skills):
        return 80
    return 0


def location_fields(location):
    if not location:
        return {
            "address": "",
            "village": "",
            "district": "",
            "state": "",
        }
    try:
        if isinstance(location, dict):
            return {
                "address": (location.get("address") or "").strip().lower(),
                "village": (location.get("village") or "").strip().lower(),
                "district": (location.get("district") or "").strip().lower(),
                "state": (location.get("state") or "").strip().lower(),
            }
        return {
            "address": (getattr(location, "address", "") or "").strip().lower(),
            "village": (getattr(location, "village", "") or "").strip().lower(),
            "district": (getattr(location, "district", "") or "").strip().lower(),
            "state": (getattr(location, "state", "") or "").strip().lower(),
        }
    except Exception:
        return {
            "address": "",
            "village": "",
            "district": "",
            "state": "",
        }


def get_location_name(location):
    if not location:
        return None
    fields = []
    if isinstance(location, dict):
        fields = [location.get("address"), location.get("village"), location.get("district"), location.get("state")]
    else:
        fields = [getattr(location, "address", None), getattr(location, "village", None), getattr(location, "district", None), getattr(location, "state", None)]
    
    # Check for specific known locations first
    for val in fields:
        if not val:
            continue
        val_lower = str(val).lower()
        if "gajuwaka" in val_lower:
            return "gajuwaka"
        if "duvvada" in val_lower:
            return "duvvada"
            
    # Or return the first non-empty field
    for val in fields:
        if val and str(val).strip():
            return str(val).strip().lower()
    return None


def location_score(worker_location, job_location):
    w_loc = get_location_name(worker_location)
    j_loc = get_location_name(job_location)
    if not w_loc or not j_loc:
        return 0
    if w_loc == j_loc:
        return 100
    return -50


def general_job_score(job_title):
    title = (job_title or "").lower()
    title_words = title.split()
    title_roots = {normalize_skill_root(w) for w in title_words}
    
    general_roots = {normalize_skill_root(g) for g in GENERAL_JOBS}
    
    # If any word root in the title matches a general job root
    for gen_root in general_roots:
        if not gen_root:
            continue
        if any(gen_root in t_root or t_root in gen_root for t_root in title_roots):
            return 20
            
    # Also fallback to basic substring checks for multi-word general jobs
    for g in GENERAL_JOBS:
        if g in title:
            return 20
            
    return 0



def is_specialized_job(job_title, job_required_skills):
    title_words = (job_title or "").lower().split()
    title_roots = {normalize_skill_root(w) for w in title_words}
    specialized_roots = {normalize_skill_root(s) for s in SPECIALIZED_JOBS}
    
    for spec_root in specialized_roots:
        if not spec_root:
            continue
        if any(spec_root in t_root for t_root in title_roots):
            return True
            
    job_skills = normalize_text_list(job_required_skills)
    for skill in job_skills:
        skill_root = normalize_skill_root(skill)
        if any(spec_root in skill_root for spec_root in specialized_roots if spec_root):
            return True
            
    return False


def hide_unrelated_specialized(worker_skills, job_title, job_required_skills):
    if not is_specialized_job(job_title, job_required_skills):
        return False
    if exact_skill_match(worker_skills, job_title, job_required_skills):
        return False
    return True


def beginner_bonus(worker_completed_jobs, job_worker_level_required):
    if worker_completed_jobs < 5:
        level_req = (job_worker_level_required or "").lower()
        if level_req == "beginner":
            return 30
    return 0


def intermediate_bonus(worker_completed_jobs, job_worker_level_required):
    if 5 <= worker_completed_jobs < 15:
        level_req = (job_worker_level_required or "").lower()
        if level_req == "intermediate":
            return 30
    return 0


def expert_bonus(worker_completed_jobs, worker_rating, job_worker_level_required):
    if worker_completed_jobs >= 15 and worker_rating >= 4:
        level_req = (job_worker_level_required or "").lower()
        if level_req in ("expert", "experienced"):
            return 30
    return 0


def rating_bonus(worker_rating):
    if worker_rating and worker_rating >= 4:
        return 10
    return 0


def duration_score(worker_level, job_duration):
    # Deprecated in the final rule-based recommendation scoring system
    return 0

