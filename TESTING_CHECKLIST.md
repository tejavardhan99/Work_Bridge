# WorkBridge Workflow - Testing Checklist

## ✅ Pre-Deployment Testing Checklist

---

## 🔧 BACKEND TESTING

### Job Lifecycle

- [ ] Job creation saves with `status: "open"`
- [ ] Job displays in job list when `status: "open"`
- [ ] Job hidden when `status: "closed"` or `status: "removed"`
- [ ] Job can only accept applications when `status: "open"`

### Application Status Flow

- [ ] New application created with `status: "pending"`
- [ ] Employer can accept → status becomes `"accepted"`
- [ ] Employer can reject → status becomes `"rejected"`
- [ ] Rejected app cannot be re-opened
- [ ] Only one worker can be accepted per job

### Start Work

- [ ] Only "accepted" applications can transition to in_progress
- [ ] Employer owner check validates
- [ ] Status updates to `"in_progress"`
- [ ] Notification sent to worker
- [ ] Application returns correctly in API response

### Mark Completed

- [ ] Only "in_progress" applications can be completed
- [ ] Status updates to `"completed"`
- [ ] Job status updates to `"closed"`
- [ ] Worker stats are updated:
  - [ ] `completed_jobs_count` incremented by 1
  - [ ] `trust_score` recalculated
  - [ ] `rating` recalculated from reviews
- [ ] Notification sent to worker

### Rating/Review Submission

- [ ] Only "completed" applications can be rated
- [ ] Cannot rate same job twice (duplicate check works)
- [ ] Rating stored in `Review` collection
- [ ] Review appended to `worker.reviews` array
- [ ] `worker.ratings` array updated with numeric rating
- [ ] `worker.rating` (average) recalculated correctly
- [ ] `worker.trust_score` recalculated
- [ ] Notification sent to worker with rating value

### Database Fields

- [ ] Worker profile has these fields:
  - [ ] `completed_jobs_count` (number, default 0)
  - [ ] `rating` (float, default 0)
  - [ ] `ratings` (array, default [])
  - [ ] `reviews` (array, default [])
  - [ ] `trust_score` (float, default 20)

- [ ] Review object has:
  - [ ] `id` (unique)
  - [ ] `rating` (1-5)
  - [ ] `comment` (text)
  - [ ] `employer_name` (string)
  - [ ] `job_id` (reference)
  - [ ] `created_at` (timestamp)

---

## 🎨 FRONTEND TESTING

### Components Exist & Import

- [ ] `StatusBadge.jsx` exists and exports
- [ ] `RatingStars.jsx` exists and exports
- [ ] `ReviewModal.jsx` exists and exports
- [ ] `ReviewCard.jsx` exists and exports
- [ ] `ActionButton.jsx` exists and exports

### StatusBadge Component

- [ ] Displays all 6 statuses with correct colors:
  - [ ] pending - Amber
  - [ ] accepted - Emerald
  - [ ] in_progress - Blue
  - [ ] completed - Purple
  - [ ] rejected - Rose
  - [ ] cancelled - Gray
- [ ] Icons display correctly
- [ ] Size prop works (sm, md, lg)
- [ ] Dark mode colors apply
- [ ] showIcon prop works

### RatingStars Component

- [ ] Display mode shows correct number of stars
- [ ] Interactive mode allows clicking to rate
- [ ] Hover effects work in interactive mode
- [ ] All 5 sizes work: sm, md, lg, xl
- [ ] Yellow fill shows for rated stars
- [ ] Gray shows for unrated stars
- [ ] Dark mode colors apply

### ReviewModal Component

- [ ] Modal opens when isOpen=true
- [ ] Modal closes on cancel/close button
- [ ] Backdrop click closes modal
- [ ] Rating selector works (1-5)
- [ ] Comment textarea accepts input
- [ ] Character count displays (0/500)
- [ ] Submit button disabled until rating selected
- [ ] Loading spinner shows during submission
- [ ] onSubmit callback fires with correct data
- [ ] Modal clears on close

### ReviewCard Component

- [ ] Displays employer name
- [ ] Shows star rating
- [ ] Shows review text
- [ ] Shows formatted date
- [ ] Truncates long text (line-clamp-3)
- [ ] Animation on view works
- [ ] Dark mode colors apply

### AppliedJobs Page

- [ ] Loads applications on mount
- [ ] Shows empty state when no applications
- [ ] Each application displays:
  - [ ] Job title
  - [ ] Employer name
  - [ ] Location
  - [ ] Salary
  - [ ] Applied date
  - [ ] Status badge
- [ ] Status timeline displays:
  - [ ] Applied (1)
  - [ ] Accepted (2)
  - [ ] In Progress (3)
  - [ ] Completed (4)
- [ ] Correct steps are marked as completed
- [ ] Status messages display correctly
- [ ] "View Details" button navigates
- [ ] Auto-refreshes every 30 seconds
- [ ] Responsive on mobile/tablet/desktop

### ViewApplicants Page

- [ ] Loads applicants for job
- [ ] Shows empty state when no applicants
- [ ] Each applicant card displays:
  - [ ] Name
  - [ ] Phone
  - [ ] Location
  - [ ] Skills
  - [ ] Rating badge
  - [ ] Completed jobs badge
  - [ ] Cover note if provided
- [ ] Status badge uses StatusBadge component
- [ ] Buttons appear based on status:
  - [ ] pending → Accept/Reject
  - [ ] accepted → Start Work
  - [ ] in_progress → Mark Completed
  - [ ] completed → Give Rating
- [ ] ReviewModal opens when Give Rating clicked
- [ ] ReviewModal closes and refreshes list on submit
- [ ] All actions show loading states
- [ ] Success/error toasts show

### WorkerProfile Page

- [ ] Page loads and shows:
  - [ ] Profile picture avatar
  - [ ] Worker name
  - [ ] Rating stars
  - [ ] Review count
  - [ ] 4-stat cards:
    - [ ] Rating (star icon)
    - [ ] Completed Jobs (award icon)
    - [ ] Reviews (mail icon)
    - [ ] Trust Score (trending icon)
- [ ] Form displays all fields:
  - [ ] Name
  - [ ] Email
  - [ ] Phone
  - [ ] Location
  - [ ] Skills
- [ ] Edit mode:
  - [ ] Fields become editable
  - [ ] Skills show comma-separated input
  - [ ] Save button appears
- [ ] View mode:
  - [ ] Fields are disabled
  - [ ] Skills show as badges
- [ ] Reviews section:
  - [ ] Shows "Recent Reviews"
  - [ ] Displays up to 5 reviews
  - [ ] Each review shows ReviewCard
  - [ ] Shows "+X more reviews" if more than 5
- [ ] Empty state shows when:
  - [ ] No reviews AND no completed jobs
  - [ ] Message says "Complete your first job to earn reviews"

---

## 🔌 API INTEGRATION TESTING

### Worker API Calls

Test in browser console or Postman:

```javascript
// Get applications
await workerAPI.getApplications()
// Expected: { results: [...applications] }

// Get profile
await workerAPI.getProfile()
// Expected: { worker: {...profile with stats} }
```

- [ ] `/workers/applications/` returns correct structure
- [ ] Application objects include all fields
- [ ] `/workers/profile/` returns worker with all reputation fields
- [ ] Reviews array is included
- [ ] Rating/trust_score are calculated

### Employer API Calls

```javascript
// Get job applications
await employerAPI.getApplications(jobId)
// Expected: { results: [...applications] }

// Accept
await employerAPI.acceptApplication(appId)
// Expected: { application: {...updated} }

// Reject
await employerAPI.rejectApplication(appId)
// Expected: { application: {...updated} }

// Start work
await employerAPI.startWork(appId)
// Expected: { application: {...updated status=in_progress} }

// Mark completed
await employerAPI.completeWork(appId)
// Expected: { application: {...updated status=completed} }

// Give review
await employerAPI.giveReview(appId, { rating: 5, comment: "Great!" })
// Expected: { review_id: "..." }
```

- [ ] All endpoints return correct status codes
- [ ] Responses include updated objects
- [ ] Error responses have error messages
- [ ] 404 for non-existent resources
- [ ] 403 for permission denied
- [ ] 400 for invalid status transitions

---

## 🎯 END-TO-END WORKFLOW TEST

### Test Scenario: Complete Job & Rate

**Setup:**
- [ ] Create test employer account
- [ ] Create test worker account
- [ ] Post a test job as employer

**Workflow:**
1. **Apply as Worker**
   - [ ] Worker navigates to job
   - [ ] Clicks "Apply"
   - [ ] Application appears in worker's AppliedJobs
   - [ ] Status shows as "Pending"

2. **Accept as Employer**
   - [ ] Employer navigates to ViewApplicants
   - [ ] Sees worker application
   - [ ] Clicks "Accept"
   - [ ] Status changes to "Accepted"
   - [ ] Toast shows success
   - [ ] Worker receives notification

3. **Start Work**
   - [ ] Employer clicks "Start Work"
   - [ ] Status changes to "In Progress"
   - [ ] Worker sees status updated in real-time
   - [ ] Timeline shows step 3 complete

4. **Mark Completed**
   - [ ] Employer clicks "Mark Completed"
   - [ ] Status changes to "Completed"
   - [ ] Job status becomes "closed"
   - [ ] Cannot apply to closed job
   - [ ] Worker stats updated:
     - [ ] completed_jobs_count = 1

5. **Submit Rating**
   - [ ] ReviewModal opens
   - [ ] Select 5 stars
   - [ ] Type review comment
   - [ ] Click "Submit Review"
   - [ ] Toast shows success
   - [ ] Modal closes
   - [ ] List refreshes

6. **Verify Worker Profile**
   - [ ] Navigate to worker profile
   - [ ] Rating stat shows 5.0
   - [ ] Completed Jobs shows 1
   - [ ] Reviews section shows employer's review
   - [ ] Trust score calculated and displayed

---

## 📱 RESPONSIVE TESTING

Test on different screen sizes:

### Mobile (< 640px)
- [ ] All cards stack vertically
- [ ] Text is readable without horizontal scroll
- [ ] Buttons are touch-friendly (min 44px height)
- [ ] Modal fits on screen
- [ ] No content overflow

### Tablet (640px - 1024px)
- [ ] 2-column layouts work
- [ ] Cards display side-by-side
- [ ] Navigation is accessible
- [ ] Touch interactions work

### Desktop (> 1024px)
- [ ] Full layouts display correctly
- [ ] 4-column grids render
- [ ] Hover states work
- [ ] Spacing looks balanced

---

## 🌙 DARK MODE TESTING

- [ ] All components render in dark mode
- [ ] Text is readable (good contrast)
- [ ] Status badges visible
- [ ] Modal background correct
- [ ] Form inputs styled correctly
- [ ] Borders visible
- [ ] Icons display properly

---

## ⚡ PERFORMANCE TESTING

- [ ] Page load time < 3 seconds
- [ ] No console errors
- [ ] API calls complete quickly
- [ ] Modal opens without lag
- [ ] Transitions are smooth
- [ ] No memory leaks (check DevTools)

---

## 🔒 SECURITY TESTING

- [ ] Cannot accept other employer's job applications
- [ ] Cannot rate job without being employer
- [ ] Cannot rate before completion
- [ ] Cannot rate same job twice
- [ ] Worker cannot start their own work
- [ ] Worker cannot complete own work
- [ ] Cannot access other user's data

---

## 🐛 ERROR HANDLING

Test error scenarios:

- [ ] Invalid job ID → 404 error
- [ ] Invalid application ID → 404 error
- [ ] Unauthorized employer → 403 error
- [ ] Wrong status transition → 400 error
- [ ] Network timeout → error toast
- [ ] Empty response → graceful handling
- [ ] All errors show user-friendly messages

---

## 📊 CROSS-BROWSER TESTING

- [ ] Chrome/Chromium
  - [ ] All features work
  - [ ] Styling correct
  - [ ] Animations smooth

- [ ] Firefox
  - [ ] All features work
  - [ ] Styling correct
  - [ ] Animations smooth

- [ ] Safari
  - [ ] All features work
  - [ ] Styling correct
  - [ ] Animations smooth

- [ ] Edge
  - [ ] All features work
  - [ ] Styling correct
  - [ ] Animations smooth

---

## 🎭 ACCESSIBILITY TESTING

- [ ] Keyboard navigation works
- [ ] Tab order is logical
- [ ] Focus indicators visible
- [ ] Color not only indicator (ratings show numbers too)
- [ ] Alt text for images
- [ ] ARIA labels where needed
- [ ] Screen reader compatible

---

## 📝 LOGGING & MONITORING

- [ ] No console errors
- [ ] No console warnings
- [ ] API calls logged correctly
- [ ] Error messages captured
- [ ] User actions trackable
- [ ] Performance metrics available

---

## 📋 FINAL CHECKLIST

**Before Merging:**
- [ ] All tests pass
- [ ] No console errors
- [ ] All features work end-to-end
- [ ] Responsive on all screen sizes
- [ ] Dark mode tested
- [ ] Security checks passed
- [ ] Performance acceptable
- [ ] Code reviewed
- [ ] Documentation updated

**Before Deploying:**
- [ ] Backend deployed successfully
- [ ] Frontend built successfully
- [ ] Database migrations run
- [ ] API endpoints working
- [ ] Firebase rules updated if needed
- [ ] Environment variables set
- [ ] Monitoring configured
- [ ] Rollback plan documented

---

## 🚀 DEPLOYMENT CHECKLIST

- [ ] Backup database
- [ ] Pull latest code
- [ ] Install dependencies
- [ ] Run migrations
- [ ] Build frontend
- [ ] Deploy to server
- [ ] Run smoke tests
- [ ] Verify API endpoints
- [ ] Check worker profile loads
- [ ] Check employer dashboard loads
- [ ] Monitor error logs
- [ ] Document any issues

---

## ✨ SUCCESS CRITERIA

Project is ready when:

✅ All tests pass
✅ No critical bugs
✅ Performance acceptable
✅ Mobile responsive
✅ Dark mode works
✅ API endpoints functional
✅ Reviews save and display
✅ Worker reputation updates
✅ Trust score calculates
✅ Notifications send
✅ User experience smooth
✅ Code well-documented

---

**Test Date:** _____________
**Tester:** _____________
**Status:** ☐ PASS ☐ FAIL
**Issues Found:** _____________
**Approved for Deployment:** ☐ YES ☐ NO

---

**Last Updated:** 2026-05-31
**Version:** 1.0
