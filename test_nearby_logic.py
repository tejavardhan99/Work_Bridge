#!/usr/bin/env python
import os
import sys
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "workbridge.settings")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    django.setup()
except Exception as e:
    print(f"Django setup error: {e}")
    sys.exit(1)

print("=" * 60)
print("Testing nearby_jobs function...")
print("=" * 60)

try:
    from apps.jobs.services import nearby_jobs
    print("✓ Successfully imported nearby_jobs")
    
    # Test with no parameters
    result = nearby_jobs()
    print(f"✓ nearby_jobs() returned {len(result)} matches")
    
    # Test with village parameter
    result = nearby_jobs(village="test")
    print(f"✓ nearby_jobs(village='test') returned {len(result)} matches")
    
    print("\n✓ All tests passed!")
    
except Exception as e:
    import traceback
    print(f"\n✗ Error: {e}")
    print("\nFull traceback:")
    traceback.print_exc()
    sys.exit(1)
