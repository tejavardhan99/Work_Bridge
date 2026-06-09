# WorkBridge Workflow - Developer Quick Reference

## 🚀 Quick Start Guide

### For Employers

**Manage Job Applications:**
```
1. Go to /manage-jobs
2. Click on a job to see applicants
3. Review applicant profiles (rating, completed jobs, skills)
4. Click "Accept" to hire → Status: accepted
5. Click "Start Work" → Status: in_progress
6. Click "Mark Completed" → Status: completed
7. Click "Give Rating" → Opens ReviewModal
8. Submit rating (1-5 stars + optional comment)
```

**Rating Modal Screenshot Flow:**
```
[Worker Name] ★★★★★
"Excellent! This worker is outstanding."
[Excellent Rating Description]
[Comment textarea]
[Cancel] [Submit Review]
```

---

### For Workers

**Track Applications:**
```
1. Go to AppliedJobs (/my-applications)
2. See all applications with status timeline
3. View workflow progress (Applied → Accepted → In Progress → Completed)
4. Click "View Details" to see job info
```

**Check Profile & Reputation:**
```
1. Go to /profile
2. View stats:
   - ⭐ Overall Rating (avg of all reviews)
   - 🏆 Completed Jobs Count
   - 💬 Total Reviews
   - 📈 Trust Score
3. See reviews section with all employer reviews
4. Edit profile to add/update skills
```

---

## 💻 Component Usage

### StatusBadge

```jsx
import StatusBadge from '../components/common/StatusBadge'

<StatusBadge status="in_progress" size="md" showIcon={true} />
```

**Statuses:** pending, accepted, in_progress, completed, rejected, cancelled
**Sizes:** sm, md, lg
**Props:** showIcon (default true)

---

### RatingStars

```jsx
import RatingStars from '../components/common/RatingStars'

{/* Display Mode */}
<RatingStars rating={4.5} size="md" />

{/* Interactive Mode */}
<RatingStars 
  rating={selectedRating}
  interactive={true}
  onRatingChange={setRating}
  size="xl"
/>
```

**Sizes:** sm, md, lg, xl
**Props:** rating, interactive, onRatingChange, size

---

### ReviewModal

```jsx
import ReviewModal from '../components/common/ReviewModal'

const [reviewModal, setReviewModal] = useState({
  open: false,
  applicationId: null,
  workerName: ''
})

const handleSubmitReview = async (reviewData) => {
  await api.submitReview(reviewData)
  setReviewModal({ open: false })
}

<ReviewModal
  isOpen={reviewModal.open}
  onClose={() => setReviewModal({ open: false })}
  onSubmit={handleSubmitReview}
  workerName={reviewModal.workerName}
  isSubmitting={false}
/>
```

**Props:** isOpen, onClose, onSubmit, workerName, isSubmitting

---

### ReviewCard

```jsx
import ReviewCard from '../components/common/ReviewCard'

{reviews.map((review, idx) => (
  <ReviewCard key={idx} review={review} index={idx} />
))}
```

**Props:** review, index (for animation delay)

---

## 🔌 API Integration

### Getting Applications

```javascript
// Worker - Get all applications
const response = await workerAPI.getApplications()
const applications = response.results

// Employer - Get applications for a job
const response = await employerAPI.getApplications(jobId)
const applicants = response.results
```

---

### Application Actions

```javascript
// Accept
await employerAPI.acceptApplication(applicationId)

// Reject
await employerAPI.rejectApplication(applicationId)

// Start work
await employerAPI.startWork(applicationId)

// Mark completed
await employerAPI.completeWork(applicationId)

// Submit review
await employerAPI.giveReview(applicationId, {
  rating: 5,
  comment: "Great worker!"
})
```

---

### Worker Profile

```javascript
// Get profile with reputation
const response = await workerAPI.getProfile()
const worker = response.worker

console.log(worker.completed_jobs_count)  // Number
console.log(worker.rating)                // Float (e.g., 4.5)
console.log(worker.reviews)               // Array
console.log(worker.trust_score)           // Float
```

---

## 🎨 Styling Classes

### Tailwind Dark Mode

All components support dark mode:
```jsx
{/* Examples */}
className="text-gray-900 dark:text-gray-100"
className="bg-white dark:bg-gray-800"
className="border-gray-200 dark:border-gray-700"
```

---

## 🔄 State Management

### Local Refresh Pattern

```javascript
const [applications, setApplications] = useState([])
const [loading, setLoading] = useState(true)

const loadApplications = async () => {
  try {
    const response = await api.getApplications()
    setApplications(response.results)
  } catch (error) {
    toast.error(error.message)
  } finally {
    setLoading(false)
  }
}

// Initial load
useEffect(() => {
  loadApplications()
}, [])

// After action (accept, reject, etc)
await api.someAction(id)
await loadApplications()  // Refresh
toast.success('Success!')
```

---

## 🎯 Status Transitions

### Valid Transitions

```
PENDING ─→ ACCEPTED ─→ IN_PROGRESS ─→ COMPLETED ✓
    └──→ REJECTED (terminal)
    └──→ CANCELLED (terminal)

IN_PROGRESS ─→ COMPLETED ✓
COMPLETED ─→ RATED ✓
```

### Invalid Transitions

```
REJECTED ─→ Anything ✗
COMPLETED ─→ IN_PROGRESS ✗  (Cannot go backward)
PENDING ─→ IN_PROGRESS ✗  (Must go through ACCEPTED)
```

---

## 🐛 Common Debugging Tips

### Check Application Status Flow

```javascript
// In browser console:
const app = applications[0]
console.log(app.status)  // Check current status
console.log(app.worker_rating)  // Check rating
console.log(app.created_at)  // Check creation time
```

### Verify API Response

```javascript
// Check what API returns
const response = await employerAPI.getApplications(jobId)
console.log(response)  // See full structure
```

### Toast for Feedback

```javascript
import toast from 'react-hot-toast'

// Success
toast.success('Action completed!')

// Error
toast.error('Something went wrong')

// Info
toast('This is a notification', { icon: 'ℹ️' })
```

---

## 📊 Data Flow Diagram

```
EMPLOYER                          WORKER
  │                                 │
  ├─→ PostJob ────────────────────→ │
  │                                 │
  │                            ApplyJob
  │                                 │
  ├─ ReviewApplicants              │
  │                                 │
  ├─ AcceptWorker ─────────────────→ │ (Status: accepted)
  │                                 │
  ├─ StartWork ──────────────────→ │ (Status: in_progress)
  │                                 │
  │                          [Work happens]
  │                                 │
  ├─ MarkCompleted ──────────────→ │ (Status: completed)
  │                                 │
  ├─ SubmitRating ────────────────→ │ (Updates reputation)
  │                                 │
  │                      UpdateStats
  │                                 │
  │                      UpdateProfile
```

---

## 🚨 Error Handling

### Common Errors

```javascript
// 404 Application not found
try {
  await employerAPI.acceptApplication(wrongId)
} catch (error) {
  console.log(error.response.status)  // 404
  toast.error("Application not found")
}

// 403 Not authorized (wrong employer)
try {
  await employerAPI.acceptApplication(id)  // Wrong job owner
} catch (error) {
  console.log(error.response.status)  // 403
  toast.error("You don't own this job")
}

// 400 Invalid status transition
try {
  await employerAPI.startWork(completedAppId)  // Wrong status
} catch (error) {
  console.log(error.response.status)  // 400
  toast.error("Can only start accepted applications")
}
```

---

## 📱 Responsive Breakpoints

```
Mobile:  < 640px
Tablet:  640px - 1024px
Desktop: > 1024px

Grid classes:
grid-cols-1          # Mobile: 1 column
md:grid-cols-2       # Tablet: 2 columns
lg:grid-cols-4       # Desktop: 4 columns
```

---

## ⚡ Performance Tips

1. **Polling Interval:** Refresh every 30s to check for updates
2. **Debounce Search:** Add delays for search inputs
3. **Lazy Load Images:** Use picture elements for profiles
4. **Memoize Components:** Use React.memo for status badges

---

## 🎓 Best Practices

### Do's ✅
- Always show loading states
- Handle errors gracefully
- Refresh after actions
- Use toast for feedback
- Show status badges
- Validate inputs

### Don'ts ❌
- Don't hardcode IDs
- Don't forget error handling
- Don't update state directly
- Don't block UI without loading state
- Don't skip permission checks

---

## 📚 Related Documentation

- [WORKFLOW_IMPLEMENTATION.md](./WORKFLOW_IMPLEMENTATION.md) - Complete implementation guide
- Backend API Docs: `/api/docs/` or `/api/redoc/`
- Repository: WorkBridge

---

**Last Updated:** 2026-05-31
**Version:** 1.0
