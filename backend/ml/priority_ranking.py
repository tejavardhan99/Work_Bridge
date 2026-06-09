"""
Priority-based job ranking system for WorkBridge.

Ranks jobs in 4 priority tiers:
  1. Same location + Same skill
  2. Same location + General jobs
  3. Other location + Same skill
  4. Other location + General jobs

Within each tier, jobs are sorted by calculated score (descending).
"""

from .scoring_rules import (
    exact_skill_match,
    get_location_name,
    general_job_score,
    is_specialized_job,
)


def get_job_priority_tier(worker, job, debug=False):
    """
    Determine which priority tier a job falls into.
    
    Returns:
        int: 0 (Priority 1) to 3 (Priority 4)
        None: if job should be excluded
    
    Priority 1: Same location + Same skill
    Priority 2: Same location + General job
    Priority 3: Other location + Same skill
    Priority 4: Other location + General job
    """
    try:
        worker_skills = getattr(worker, 'skills', [])
        worker_location = getattr(worker, 'location', None)
        
        job_title = job.get('title') if isinstance(job, dict) else getattr(job, 'title', '')
        job_required_skills = job.get('required_skills') if isinstance(job, dict) else getattr(job, 'required_skills', [])
        job_location = job.get('location') if isinstance(job, dict) else getattr(job, 'location', None)
        
        # Get location names
        w_loc = get_location_name(worker_location)
        j_loc = get_location_name(job_location)
        
        # Determine if same location
        same_location = w_loc and j_loc and (w_loc == j_loc)
        
        # Determine if skill match
        skill_matched = exact_skill_match(worker_skills, job_title, job_required_skills)
        
        # Determine if general job
        is_general = general_job_score(job_title) > 0
        
        # Check if it's a specialized job with no match
        is_specialized = is_specialized_job(job_title, job_required_skills)
        if is_specialized and not skill_matched:
            if debug:
                print(f"[SKIP] {job_title} - Specialized job but skill doesn't match")
            return None  # Hide unrelated specialized jobs
        
        if debug:
            print(f"\n[JOB ANALYSIS] {job_title}")
            print(f"  Worker Location: {w_loc}")
            print(f"  Job Location: {j_loc}")
            print(f"  Same Location: {same_location}")
            print(f"  Worker Skills: {worker_skills}")
            print(f"  Job Required Skills: {job_required_skills}")
            print(f"  Skill Matched: {skill_matched}")
            print(f"  Is General Job: {is_general}")
            print(f"  Is Specialized Job: {is_specialized}")
        
        # Assign priority tier
        if same_location and skill_matched:
            if debug:
                print(f"  → TIER 0: Same Location + Same Skill")
            return 0  # Priority 1: Same location + Same skill
        elif same_location and is_general:
            if debug:
                print(f"  → TIER 1: Same Location + General Job")
            return 1  # Priority 2: Same location + General job
        elif skill_matched:
            if debug:
                print(f"  → TIER 2: Other Location + Same Skill")
            return 2  # Priority 3: Other location + Same skill
        elif is_general:
            if debug:
                print(f"  → TIER 3: Other Location + General Job")
            return 3  # Priority 4: Other location + General job
        else:
            # Job doesn't match any tier (not skill-matched and not general)
            if debug:
                print(f"  → TIER 3: No Match (Low Priority)")
            return 3  # Treat as Priority 4 (low priority)
            
    except Exception as e:
        print(f'Error determining job priority tier: {str(e)}')
        import traceback
        traceback.print_exc()
        return None


def rank_jobs_by_priority(worker, jobs, calculate_score_func, debug=False):
    """
    Rank jobs by priority tier, then by calculated score within each tier.
    
    Args:
        worker: Worker profile object
        jobs: Iterable of Job objects
        calculate_score_func: Function to calculate job score (worker, job) -> float
        debug: Enable debug logging
    
    Returns:
        List of tuples: [(job, score, priority_tier), ...]
        Sorted by (priority_tier, -score)
    """
    if debug:
        print("\n" + "="*60)
        print("PRIORITY-BASED JOB RANKING START")
        print("="*60)
        worker_skills = getattr(worker, 'skills', [])
        worker_location = getattr(worker, 'location', None)
        w_loc = get_location_name(worker_location)
        print(f"Worker Location: {w_loc}")
        print(f"Worker Skills: {worker_skills}")
        print("="*60)
    
    ranked_jobs = []
    
    for job in jobs:
        tier = get_job_priority_tier(worker, job, debug=debug)
        
        if tier is None:
            continue  # Skip jobs that should be hidden
        
        score = calculate_score_func(worker, job)
        if score is None or score <= 0:
            # Jobs with no score are still shown but with tier-based ranking
            # This ensures priority tier takes precedence
            score = 0
        
        ranked_jobs.append({
            'job': job,
            'score': score,
            'tier': tier,
        })
    
    # Sort by tier (ascending, 0 is highest priority), then by score (descending)
    ranked_jobs.sort(key=lambda x: (x['tier'], -x['score']))
    
    if debug:
        print("\n" + "="*60)
        print("FINAL RANKING:")
        print("="*60)
        tier_names = {
            0: "TIER 0: Same Location + Same Skill",
            1: "TIER 1: Same Location + General",
            2: "TIER 2: Other Location + Same Skill",
            3: "TIER 3: Other Location + General",
        }
        current_tier = None
        for i, item in enumerate(ranked_jobs, 1):
            if item['tier'] != current_tier:
                current_tier = item['tier']
                print(f"\n{tier_names.get(current_tier, 'UNKNOWN')}")
            job = item['job']
            job_title = job.get('title') if isinstance(job, dict) else getattr(job, 'title', 'Unknown')
            print(f"  {i}. {job_title} (Score: {item['score']})")
        print("="*60 + "\n")
    
    return [(item['job'], round(item['score'], 2), item['tier']) for item in ranked_jobs]


def format_ranking_info(ranked_jobs_with_tier):
    """
    Format ranking information for debugging/logging.
    
    Args:
        ranked_jobs_with_tier: List from rank_jobs_by_priority()
    
    Returns:
        str: Formatted debug information
    """
    tier_names = {
        0: "Priority 1: Same Location + Same Skill",
        1: "Priority 2: Same Location + General",
        2: "Priority 3: Other Location + Same Skill",
        3: "Priority 4: Other Location + General",
    }
    
    lines = ["=== JOB RANKING ==="]
    current_tier = None
    
    for job, score, tier in ranked_jobs_with_tier:
        if tier != current_tier:
            current_tier = tier
            lines.append(f"\n{tier_names.get(tier, 'Unknown')}")
        
        job_title = job.get('title') if isinstance(job, dict) else getattr(job, 'title', 'Unknown')
        lines.append(f"  - {job_title} (Score: {score})")
    
    return "\n".join(lines)

