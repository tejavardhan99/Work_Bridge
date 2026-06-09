from django.core.management.base import BaseCommand

from apps.accounts.documents import User
from apps.accounts.services import register_user
from apps.common.documents import Location
from apps.common.firebase_config import ping_firebase
from apps.employers.services import create_employer_profile
from apps.jobs.documents import Job, JobApplication, Review
from apps.jobs.services import create_job
from apps.workers.services import create_worker_profile, update_trust_score


class Command(BaseCommand):
    help = "Create dynamic demo data in Firebase Realtime Database for WorkBridge API testing."

    def add_arguments(self, parser):
        parser.add_argument("--reset-demo", action="store_true", help="Delete existing demo records before seeding.")

    def handle(self, *args, **options):
        result = ping_firebase()
        if not result["connected"]:
            raise CommandError(f"Firebase connection failed: {result.get('error', 'unknown error')}")

        if options["reset_demo"]:
            self.reset_demo_records()

        worker_user = self.get_or_create_user(
            name="Demo Worker",
            phone="+919000000001",
            email="worker.demo@workbridge.local",
            password="WorkerPass123",
            role=User.ROLE_WORKER,
        )
        employer_user = self.get_or_create_user(
            name="Demo Employer",
            phone="+919000000002",
            email="employer.demo@workbridge.local",
            password="EmployerPass123",
            role=User.ROLE_EMPLOYER,
        )
        admin_user = self.get_or_create_user(
            name="Demo Admin",
            phone="+919000000003",
            email="admin.demo@workbridge.local",
            password="AdminPass123",
            role=User.ROLE_ADMIN,
        )

        worker = create_worker_profile(worker_user)
        worker.location = Location(address="Near water tank", village="Rampur", district="Medchal", state="Telangana")
        worker.skills = ["plumbing", "pump repair", "pipe fitting"]
        worker.languages = ["Telugu", "Hindi"]
        worker.availability = True
        worker.completed_jobs_count = 5
        worker.ratings = [4, 5, 4]
        worker.consistency_score = 80
        worker.skill_verification_score = 40
        update_trust_score(worker)

        employer = create_employer_profile(employer_user)
        employer.organization_name = "Green Fields Farm"
        employer.business_type = "Agriculture"
        employer.location = Location(address="Farm road", village="Rampur", district="Medchal", state="Telangana")
        employer.save()

        job = Job.objects(title="Urgent pump repair", employer=employer).first()
        if not job:
            job = create_job(
                employer,
                {
                    "title": "Urgent pump repair",
                    "description": "Repair borewell pump and check pipe leakage at farm site.",
                    "required_skills": ["plumbing", "pump repair"],
                    "salary": 1200,
                    "duration": "1 day",
                    "urgency": "urgent",
                    "worker_level_required": "Beginner",
                    "location": Location(address="Farm road", village="Rampur", district="Medchal", state="Telangana"),
                },
            )

        open_job = Job.objects(title="Pipe fitting support", employer=employer, status=Job.STATUS_OPEN).first()
        if not open_job:
            open_job = create_job(
                employer,
                {
                    "title": "Pipe fitting support",
                    "description": "Install temporary irrigation pipe line for two crop beds.",
                    "required_skills": ["pipe fitting", "plumbing"],
                    "salary": 900,
                    "duration": "6 hours",
                    "urgency": "normal",
                    "worker_level_required": "Beginner",
                    "location": Location(address="Farm road", village="Rampur", district="Medchal", state="Telangana"),
                },
            )

        application = JobApplication.objects(worker=worker, job=job).first()
        if not application:
            application = JobApplication(worker=worker, job=job, status=JobApplication.STATUS_COMPLETED, cover_note="I can reach today.").save()
            job.assigned_worker = worker
            job.status = Job.STATUS_CLOSED
            job.save()

        if not Review.objects(job=job, worker=worker, employer=employer).first():
            Review(job=job, worker=worker, employer=employer, rating=5, comment="Good work and arrived on time.", created_by=employer_user).save()

        self.stdout.write(self.style.SUCCESS("Seeded WorkBridge demo data."))
        self.stdout.write("Worker login: worker.demo@workbridge.local / WorkerPass123")
        self.stdout.write("Employer login: employer.demo@workbridge.local / EmployerPass123")
        self.stdout.write("Admin login: admin.demo@workbridge.local / AdminPass123")
        self.stdout.write(f"Demo worker_id: {worker.id}")
        self.stdout.write(f"Completed demo job_id: {job.id}")
        self.stdout.write(f"Open demo job_id: {open_job.id}")

    def get_or_create_user(self, *, name, phone, email, password, role):
        return User.objects(email=email).first() or register_user(name=name, phone=phone, email=email, password=password, role=role)

    def reset_demo_records(self):
        demo_jobs = list(Job.objects(title__in=["Urgent pump repair", "Pipe fitting support"]))
        for job in demo_jobs:
            JobApplication.objects(job=job).delete()
            Review.objects(job=job).delete()
            job.delete()
        users = list(User.objects(email__in=["worker.demo@workbridge.local", "employer.demo@workbridge.local", "admin.demo@workbridge.local"]))
        for user in users:
            user.delete()
