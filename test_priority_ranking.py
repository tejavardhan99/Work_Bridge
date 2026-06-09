#!/usr/bin/env python
"""
Test script for priority-based job ranking system.

Tests the fix for the WorkBridge Dashboard "Nearby Jobs" recommendation ranking.
Verifies that:
1. Same-location plumber jobs appear first
2. General jobs appear after skill-matched jobs
3. Other-location jobs appear at bottom
"""

import os
import sys
import django
from types import SimpleNamespace

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'workbridge.settings')
sys.path.insert(0, '/d/CSP_pro')
django.setup()

from apps.common.documents import Location
from apps.jobs.documents import Job
from backend.ml.recommendation_engine import calculate_score
from backend.ml.priority_ranking import rank_jobs_by_priority


def create_test_worker(location_village="Duvvada", skills=None):
    """Create a test worker with specified location and skills."""
    if skills is None:
        skills = ["plumber"]
    
    worker = SimpleNamespace(
        id="test_worker",
        location=Location(village=location_village, district="Visakhapatnam", state="Andhra Pradesh"),
        skills=skills,
        completed_jobs_count=0,
        average_rating=0,
        rating=0,
        level="Beginner"
    )
    return worker


def create_test_job(title, skills=None, location_village="Duvvada"):
    """Create a test job with specified title and location."""
    if skills is None:
        skills = []
    
    job = SimpleNamespace(
        id=f"job_{title.replace(' ', '_')}",
        title=title,
        required_skills=skills,
        location=Location(village=location_village, district="Visakhapatnam", state="Andhra Pradesh"),
        description=f"Test job: {title}",
        salary=5000,
        duration="1 week",
        urgency="normal",
        worker_level_required="Beginner",
        status=Job.STATUS_OPEN,
        openings=1,
        filled_openings=0,
    )
    return job


def test_plumber_ranking():
    """Test that plumber jobs appear before general jobs."""
    
    print("\n" + "="*70)
    print("TEST: Plumber Worker Job Ranking")
    print("="*70)
    
    # Create test worker: Plumber in Duvvada
    worker = create_test_worker(location_village="Duvvada", skills=["plumber"])
    
    print(f"\nWorker Profile:")
    print(f"  Location: {worker.location.village}")
    print(f"  Skills: {worker.skills}")
    print(f"  Level: {worker.level}")
    
    # Create test jobs
    test_jobs = [
        # Priority 1: Same location + Same skill
        create_test_job("Plumber", skills=["plumber"], location_village="Duvvada"),
        create_test_job("Basic Plumbing Work", skills=["plumber"], location_village="Duvvada"),
        create_test_job("Pipe Repair", skills=["plumber"], location_village="Duvvada"),
        create_test_job("Plumbing Helper", skills=["plumber", "helper"], location_village="Duvvada"),
        
        # Priority 2: Same location + General
        create_test_job("Shop Assistant", skills=["retail"], location_village="Duvvada"),
        create_test_job("Construction Helper", skills=["construction"], location_village="Duvvada"),
        create_test_job("House Cleaning", skills=["cleaning"], location_village="Duvvada"),
        create_test_job("Delivery Helper", skills=["delivery"], location_village="Duvvada"),
        
        # Priority 3: Other location + Same skill
        create_test_job("Plumber", skills=["plumber"], location_village="Gajuwaka"),
        create_test_job("Pipe Repair", skills=["plumber"], location_village="Gajuwaka"),
        
        # Priority 4: Other location + General
        create_test_job("Shop Assistant", skills=["retail"], location_village="Gajuwaka"),
        create_test_job("Gardener", skills=["gardening"], location_village="Gajuwaka"),
    ]
    
    # Rank jobs
    ranked = rank_jobs_by_priority(worker, test_jobs, calculate_score, debug=True)
    
    # Verify ranking
    print("\n" + "="*70)
    print("RANKING VERIFICATION")
    print("="*70)
    
    success = True
    
    # Check that all Tier 0 jobs are skill-matched + same location
    tier_0_correct = all(ranked[i][2] == 0 for i in range(4))
    
    if tier_0_correct:
        print("✓ First 4 jobs are Tier 0 (Same Location + Same Skill)")
    else:
        print("✗ FAILED: First 4 jobs should all be Tier 0")
        success = False
    
    # Check that general jobs come next
    general_jobs_start = 4
    general_jobs_correct = all(
        ranked[i][2] == 1  # Tier 1
        for i in range(general_jobs_start, general_jobs_start + 4)
    )
    
    if general_jobs_correct:
        print("✓ General jobs appear after plumber jobs (Tier 1)")
    else:
        print("✗ FAILED: General jobs should appear after plumber jobs")
        success = False
    
    # Check that other location jobs come last
    other_location_start = 8
    other_location_correct = all(
        ranked[i][2] >= 2  # Tier 2 or 3
        for i in range(other_location_start, len(ranked))
    )
    
    if other_location_correct:
        print("✓ Other location jobs appear at bottom")
    else:
        print("✗ FAILED: Other location jobs should appear at bottom")
        success = False
    
    print("\n" + "="*70)
    if success:
        print("✓ ALL TESTS PASSED")
    else:
        print("✗ SOME TESTS FAILED")
    print("="*70)
    
    return success


if __name__ == "__main__":
    try:
        success = test_plumber_ranking()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\nERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
