# WorkBridge Job Recommendation Ranking Fix

## Overview

This document describes the fix implemented for the WorkBridge Dashboard "Nearby Jobs" recommendation ranking issue. The system now correctly prioritizes skill-matched jobs over general jobs, regardless of location.

## Issue Summary

**Problem:** Workers with specific skills (e.g., "plumber") were seeing general jobs (Shop Assistant, Delivery Helper, House Cleaning, Construction Helper) appearing BEFORE skill-matched jobs from their location.

**Expected Behavior:** Plumber jobs should appear first, followed by general jobs, then jobs from other locations.

## Solution: Priority-Based Ranking System

Instead of relying solely on additive scoring, the system now explicitly categorizes jobs into 4 priority tiers and ranks within each tier.

### Priority Tiers

```
TIER 0: Same Location + Same Skill (HIGHEST PRIORITY)
├── Example: Plumber job in Duvvada for plumber worker in Duvvada
│
TIER 1: Same Location + General Jobs
├── Example: Shop Assistant in Duvvada for plumber worker in Duvvada
│
TIER 2: Other Location + Same Skill
├── Example: Plumber job in Gajuwaka for plumber worker in Duvvada
│
TIER 3: Other Location + General Jobs (LOWEST PRIORITY)
└── Example: Shop Assistant in Gajuwaka for plumber worker in Duvvada
```

### Within-Tier Sorting

Within each tier, jobs are sorted by calculated score (descending):
- Skill match bonus: +80
- Location bonus: +100 (same) or -50 (different)
- General job bonus: +20
- Level/experience bonuses: +30
- Rating bonus: +10

## Implementation

### New Files Created

#### `backend/ml/priority_ranking.py`

Core module implementing the priority-based ranking system.

**Key Functions:**

- **`get_job_priority_tier(worker, job, debug=False)`**
  - Determines which tier (0-3) a job belongs to
  - Returns `None` if job should be excluded (specialized job without skill match)
  - Supports debug logging

- **`rank_jobs_by_priority(worker, jobs, calculate_score_func, debug=False)`**
  - Ranks jobs by tier, then by score within each tier
  - Returns list of `(job, score, tier)` tuples sorted by priority
  - Comprehensive debug output showing tier assignments

- **`format_ranking_info(ranked_jobs_with_tier)`**
  - Formats ranking info for debugging/display

**Debug Output Example:**

```
============================================================
PRIORITY-BASED JOB RANKING START
============================================================
Worker Location: duvvada
Worker Skills: ['plumber']
============================================================

[JOB ANALYSIS] Plumber
  Worker Location: duvvada
  Job Location: duvvada
  Same Location: True
  Worker Skills: ['plumber']
  Job Required Skills: ['plumber']
  Skill Matched: True
  Is General Job: False
  Is Specialized Job: True
  → TIER 0: Same Location + Same Skill

...

============================================================
FINAL RANKING:
============================================================

TIER 0: Same Location + Same Skill
  1. Plumber (Score: 210)
  2. Basic Plumbing Work (Score: 210)

TIER 1: Same Location + General
  3. Shop Assistant (Score: 150)
  4. Delivery Helper (Score: 150)

TIER 2: Other Location + Same Skill
  5. Plumber - Gajuwaka (Score: 60)

TIER 3: Other Location + General
  6. Shop Assistant - Gajuwaka (Score: 0)
```

### Modified Files

#### 1. `apps/jobs/services/recommendation_service.py`

**Updated `nearby_jobs_for_query()` function:**
- Now uses `rank_jobs_by_priority()` instead of pure score sorting
- Ensures unauthenticated user queries use the same ranking logic
- Maintains backward compatibility with `(job, score)` tuple return format

```python
# Before:
matches = sorted(matches, key=lambda item: item[1], reverse=True)

# After:
ranked = rank_jobs_by_priority(worker, jobs, calculate_score)
return [(item[0], item[1]) for item in ranked]
```

#### 2. `apps/jobs/views.py` - `NearbyJobsView`

**Updated job ranking for authenticated workers:**
- Applies priority ranking instead of pure score sorting
- Filters by level requirement first
- Then uses `rank_jobs_by_priority()` for final ordering

```python
# Before:
for job in Job.objects(...):
    if not level_allowed(...):
        continue
    score = calculate_score(worker, job)
    matches.append((job, round(score, 2)))
matches = sorted(matches, key=lambda item: item[1], reverse=True)

# After:
eligible_jobs = [job for job in Job.objects(...) if level_allowed(...)]
ranked = rank_jobs_by_priority(worker, eligible_jobs, calculate_score)
matches = [(item[0], item[1]) for item in ranked]
```

#### 3. `apps/recommendations/services.py` - `recommend_jobs_for_worker()`

**Updated recommendation page ranking:**
- Uses priority-based ranking for consistency with dashboard
- Maintains dict format with 'job', 'score', 'distance_km' keys

```python
# Before:
scored = []
for job in jobs:
    score = calculate_score(worker, job)
    scored.append({'job': job, 'score': score, ...})
return sorted(scored, key=lambda item: item['score'], reverse=True)

# After:
ranked = rank_jobs_by_priority(worker, eligible_jobs, calculate_score)
scored = [{'job': j, 'score': s, 'distance_km': None} for j, s, _ in ranked]
return scored
```

#### 4. `backend/ml/recommendation_engine.py`

**Enhanced debug logging:**
- Added optional `debug` parameter to `calculate_score()`
- When `debug=True`, prints detailed score breakdown
- Helps verify scoring calculations

```python
def calculate_score(worker, job, debug=False):
    # ... calculation ...
    if debug:
        print("\n" + "="*70)
        print("SCORE CALCULATION DEBUG")
        print(f"Job Title: {job_title}")
        print(f"Worker Skills: {worker_skills}")
        print(f"Skill Match: {exact_skill_match(...)} (+{sk_score})")
        # ... more details ...
        print(f"FINAL SCORE: {score}")
        print("="*70 + "\n")
```

## Testing

### Test Script: `test_priority_ranking.py`

Created comprehensive test to verify the fix:

```bash
$ python test_priority_ranking.py

======================================================================
TEST: Plumber Worker Job Ranking
======================================================================

✓ First 4 jobs are Tier 0 (Same Location + Same Skill)
✓ General jobs appear after plumber jobs (Tier 1)
✓ Other location jobs appear at bottom

======================================================================
✓ ALL TESTS PASSED
======================================================================
```

**Test Coverage:**
- ✓ Same-location skill-matched jobs appear first (Tier 0)
- ✓ Same-location general jobs appear second (Tier 1)
- ✓ Other-location jobs appear last (Tier 2-3)
- ✓ Within-tier scoring applies correctly

## Verification Checklist

- ✓ Worker skill comes from profile
- ✓ Worker location comes from profile
- ✓ Same-location plumber jobs appear first
- ✓ General jobs appear only after plumber jobs
- ✓ Other-location jobs appear at bottom
- ✓ Dashboard uses priority-based ranking
- ✓ Recommendation page uses priority-based ranking
- ✓ No syntax errors in all modified files

## Debug Instructions

To enable debug logging for troubleshooting:

### Dashboard Debug (Authenticated Worker)

Edit `apps/jobs/views.py` in `NearbyJobsView.get()`:

```python
# Add debug=True parameter
ranked = rank_jobs_by_priority(worker, eligible_jobs, calculate_score, debug=True)
```

### Unauthenticated Query Debug

Edit `apps/jobs/services/recommendation_service.py`:

```python
# Add debug=True parameter  
ranked = rank_jobs_by_priority(worker, jobs, calculate_score, debug=True)
```

Debug output will show:
```
Worker Location: duvvada
Worker Skills: ['plumber']

[JOB ANALYSIS] Plumber
  ...
  → TIER 0: Same Location + Same Skill
```

## Location Handling

The system correctly handles location comparisons:

- **Supported locations:** Duvvada, Gajuwaka
- **Case-insensitive matching:** "DUVVADA" = "duvvada"
- **Location field support:**
  - village
  - district
  - state
  - address

The `get_location_name()` function extracts the primary location name for comparison.

## Backward Compatibility

- ✓ API response format unchanged (still returns job + score tuples)
- ✓ Existing database schemas compatible
- ✓ No breaking changes to serializers or views
- ✓ All existing endpoints continue to work

## Performance Notes

- **Time Complexity:** O(n log n) where n = number of open jobs
- **Sorting:** Two-level sort by (tier, -score)
- **No additional database queries** - all filtering done in Python
- **Suitable for 1000+ job listings**

## Future Enhancements

1. **Skill Proficiency Levels:** Add weights based on skill level match
2. **Distance Weighting:** Re-enable geographic distance scoring
3. **User Preferences:** Allow workers to set priority preferences
4. **Machine Learning:** Learn tier weights from user behavior
5. **A/B Testing:** Compare ranking algorithms

## Support

For issues or questions about the ranking system:

1. Check debug output using `debug=True` parameter
2. Review test script output: `python test_priority_ranking.py`
3. Verify job data has correct location and skills fields
4. Confirm worker profile has location and skills set
