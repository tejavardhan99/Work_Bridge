#!/usr/bin/env python
import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "workbridge.settings")
django.setup()

from apps.jobs.services import nearby_jobs

try:
    result = nearby_jobs(village="test")
    print(f"Success! Found {len(result)} jobs")
    if result:
        job, score = result[0]
        print(f"First job: {job.title}, score: {score}")
except Exception as e:
    import traceback
    print(f"Error: {e}")
    traceback.print_exc()
