import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { employerAPI, jobsAPI } from '../services/api'
import toast from 'react-hot-toast'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import StatusBadge from '../components/common/StatusBadge'
import ReviewModal from '../components/common/ReviewModal'
import { useUIStore } from '../context/store'
import { MapPin, Star, Briefcase, Phone, Mail, Award, Check, X, ArrowLeft } from 'lucide-react'

const ViewApplicants = () => {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [applicants, setApplicants] = useState([])
  const [loading, setLoading] = useState(true)
  const [actioningId, setActioningId] = useState(null)
  const [reviewModal, setReviewModal] = useState({ open: false, applicationId: null, workerName: '' })
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const { fetchNotifications } = useUIStore()

  useEffect(() => {
    loadJobAndApplicants()
  }, [jobId])

  const loadJobAndApplicants = async () => {
    try {
      setLoading(true)
      const jobResponse = await jobsAPI.getJobDetails(jobId)
      setJob(jobResponse.job)

      const appsResponse = await employerAPI.getApplications(jobId)
      setApplicants(appsResponse.results || [])
    } catch (error) {
      console.error(error)
      toast.error('Failed to load applicants')
    } finally {
      setLoading(false)
    }
  }

  const handleDecision = async (applicationId, status) => {
    try {
      setActioningId(applicationId)
      if (status === 'accepted') {
        await employerAPI.acceptApplication(applicationId)
        toast.success('Applicant accepted successfully!')
      } else {
        await employerAPI.rejectApplication(applicationId)
        toast.success('Applicant rejected successfully.')
      }
      await fetchNotifications().catch((error) => {
        console.error('ViewApplicants decision notification refresh failed:', error)
      })
      // Refresh the applications list
      const appsResponse = await employerAPI.getApplications(jobId)
      setApplicants(appsResponse.results || [])
    } catch (error) {
      console.error(error)
      toast.error(`Failed to ${status} applicant.`)
    } finally {
      setActioningId(null)
    }
  }

  const handleStartWork = async (applicationId) => {
    try {
      setActioningId(applicationId)
      await employerAPI.startWork(applicationId)
      toast.success('Work started')
      await fetchNotifications().catch((error) => {
        console.error('ViewApplicants start work notification refresh failed:', error)
      })
      const appsResponse = await employerAPI.getApplications(jobId)
      setApplicants(appsResponse.results || [])
    } catch (error) {
      console.error(error)
      toast.error('Failed to start work')
    } finally {
      setActioningId(null)
    }
  }

  const handleCompleteWork = async (applicationId) => {
    try {
      setActioningId(applicationId)
      await employerAPI.completeWork(applicationId)
      toast.success('Job marked completed')
      await fetchNotifications().catch((error) => {
        console.error('ViewApplicants complete work notification refresh failed:', error)
      })
      const appsResponse = await employerAPI.getApplications(jobId)
      setApplicants(appsResponse.results || [])
    } catch (error) {
      console.error(error)
      toast.error('Failed to mark completed')
    } finally {
      setActioningId(null)
    }
  }

  const handleGiveReview = (applicationId, workerName) => {
    const app = applicants.find(a => a.id === applicationId)
    if (app?.reviewed) {
      toast.error('Review already submitted for this application')
      return
    }
    setReviewModal({ 
      open: true, 
      applicationId, 
      workerName: workerName || 'Worker',
      app
    })
  }

  const handleSubmitReview = async (reviewData) => {
    try {
      setReviewSubmitting(true)
      // ensure we have the app context
      const app = reviewModal.app
      const rating = reviewData.rating
      const comment = reviewData.comment || reviewData.review || ''

      // Task 1 logging: ensure none are undefined/null/empty
      const payloadCheck = {
        worker_id: app?.worker_id,
        application_id: reviewModal.applicationId,
        job_id: app?.job_id,
        rating,
        review: comment,
      }
      console.log('Submitting review payload check:', payloadCheck)

      if (!rating || rating === 0) {
        toast.error('Please select a rating')
        setReviewSubmitting(false)
        return
      }

      const payload = {
        worker_id: String(app?.worker_id || ''),
        application_id: String(reviewModal.applicationId),
        job_id: String(app?.job_id || ''),
        rating,
        review: comment,
        comment,
      }

      const response = await employerAPI.giveReview(reviewModal.applicationId, payload)
      console.log('Review Response:', response)
      toast.success('Review submitted successfully')
      await fetchNotifications().catch((error) => {
        console.error('ViewApplicants review notification refresh failed:', error)
      })
      setReviewModal({ open: false, applicationId: null, workerName: '' })
      const appsResponse = await employerAPI.getApplications(jobId)
      setApplicants(appsResponse.results || [])
    } catch (error) {
      console.error('Review submit error:', error)
      console.error('Response data:', error?.response?.data)
      // try to show helpful error messages from backend
      const resp = error?.response?.data
      if (resp) {
        // handle HTTP 409 Conflict specifically
        const status = error?.response?.status
        if (status === 409) {
          const msg = resp.error || 'Review already submitted for this job'
          toast.error(msg)
          setReviewModal({ open: false, applicationId: null, workerName: '' })
          const appsResp = await employerAPI.getApplications(jobId)
          setApplicants(appsResp.results || [])
          return
        }
        // prefer explicit error
        if (resp.error) {
          toast.error(resp.error)
        } else if (resp.detail) {
          toast.error(resp.detail)
        } else {
          // look for validation keys
          const firstKey = Object.keys(resp)[0]
          const val = resp[firstKey]
          let message = 'Failed to submit review'
          if (!val) {
            message = JSON.stringify(resp)
          } else if (typeof val === 'string') {
            message = val
          } else if (Array.isArray(val)) {
            message = val.join(' ')
          } else {
            // handle DRF ErrorDetail or objects
            try {
              message = String(val)
            } catch (e) {
              message = JSON.stringify(val)
            }
          }

          // map common server messages to friendlier ones
          if (message.toLowerCase().includes('already been rated') || message.toLowerCase().includes('already rated')) {
            toast.error('Review already submitted for this job')
            // close modal and refresh list
            setReviewModal({ open: false, applicationId: null, workerName: '' })
            const appsResp = await employerAPI.getApplications(jobId)
            setApplicants(appsResp.results || [])
          } else if (message.toLowerCase().includes('rating required') || message.toLowerCase().includes('rating is required')) {
            toast.error('Rating required')
          } else {
            toast.error(message)
          }
        }
      } else {
        toast.error('Failed to submit review')
      }
    } finally {
      setReviewSubmitting(false)
    }
  }

  const handleCloseReviewModal = () => {
    setReviewModal({ open: false, applicationId: null, workerName: '' })
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'accepted':
        return 'bg-emerald-100 text-emerald-800 border border-emerald-200'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border border-blue-200'
      case 'cancelled':
        return 'bg-rose-50 text-rose-700 border border-rose-100'
      case 'rejected':
        return 'bg-rose-100 text-rose-800 border border-rose-200'
      case 'completed':
        return 'bg-blue-100 text-blue-800 border border-blue-200'
      case 'pending':
      default:
        return 'bg-amber-100 text-amber-800 border border-amber-200'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-5xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/manage-jobs')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition text-gray-600 dark:text-gray-300"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            Applicants List
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Review and manage candidates for <span className="font-semibold text-primary-600">{job?.title || 'Job Posting'}</span>
          </p>
        </div>
      </div>

      {applicants.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          <AnimatePresence mode="popLayout">
            {applicants.map((app, index) => {
              console.log('Applicant data:', app)
              const rawLocation = app.worker_location
              let locationStr = 'Location not listed'

              if (typeof rawLocation === 'string') {
                locationStr = rawLocation.trim() || locationStr
              } else if (rawLocation && typeof rawLocation === 'object') {
                const parts = [
                  rawLocation.address,
                  rawLocation.village,
                  rawLocation.district,
                  rawLocation.state,
                ]
                  .filter(Boolean)
                  .map((part) => part.trim())
                  .filter(Boolean)

                locationStr = parts.join(', ') || locationStr
              }

              return (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="p-6 transition-all duration-300 border border-gray-100 dark:border-gray-800 hover:shadow-md">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                      
                      {/* Left: Worker profile summary */}
                      <div className="flex-1 space-y-4">
                        <div className="flex flex-wrap items-start justify-between lg:justify-start gap-3">
                          <div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                              {app.worker_name || 'Worker Profile'}
                            </h3>
                            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                              <span className="flex items-center space-x-1">
                                <Phone size={14} className="text-gray-400" />
                                <span>{app.worker_phone || 'Phone unlisted'}</span>
                              </span>
                              {app.worker_email && (
                                <span className="flex items-center space-x-1">
                                  <Mail size={14} className="text-gray-400" />
                                  <span>{app.worker_email}</span>
                                </span>
                              )}
                              <span className="flex items-center space-x-1">
                                <MapPin size={14} className="text-gray-400" />
                                <span>{locationStr}</span>
                              </span>
                            </div>
                          </div>

                          {/* Stats Badge */}
                          <div className="flex items-center space-x-3">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <Star size={12} className="text-amber-500 fill-amber-500 mr-1" />
                              {app.worker_rating?.toFixed(1) || '0.0'} Rating
                            </span>
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Award size={12} className="text-emerald-500 mr-1" />
                              {app.worker_completed_jobs || 0} Hired Works
                            </span>
                          </div>
                        </div>

                        {/* Skills display */}
                        {app.worker_skills?.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-xs font-semibold text-gray-400 block uppercase tracking-wider">Skills</span>
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {app.worker_skills.map((skill, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center justify-center rounded-full bg-primary-50 text-primary-700 dark:bg-gray-800 dark:text-gray-300 px-3 py-0.5 text-xs font-semibold"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Cover note display */}
                        {app.cover_note && (
                          <div className="p-3 bg-gray-50 dark:bg-gray-850 rounded-lg border border-gray-100 dark:border-gray-800">
                            <span className="text-xs font-semibold text-gray-400 block uppercase tracking-wider mb-1">Worker Cover Note</span>
                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic">
                              "{app.cover_note}"
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Right: Status & Actions */}
                      <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-start gap-4 lg:min-w-[200px] pt-4 lg:pt-0 border-t lg:border-t-0 border-gray-100 lg:border-l lg:pl-6 dark:border-gray-800">
                        <div className="text-left lg:text-right">
                          <span className="text-xs font-semibold text-gray-400 block uppercase tracking-wider mb-1">Status</span>
                          <StatusBadge status={app.status} size="md" />
                        </div>

                        {app.status === 'pending' && (
                          <div className="flex items-center gap-2 w-full lg:mt-4">
                            <Button
                              variant="primary"
                              size="sm"
                              loading={actioningId === app.id}
                              onClick={() => handleDecision(app.id, 'accepted')}
                              className="flex-1 flex items-center justify-center space-x-1 bg-emerald-600 hover:bg-emerald-700 border-none shadow-sm text-white"
                            >
                              <Check size={16} />
                              <span>Accept</span>
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              loading={actioningId === app.id}
                              onClick={() => handleDecision(app.id, 'rejected')}
                              className="flex-1 flex items-center justify-center space-x-1 shadow-sm text-white"
                            >
                              <X size={16} />
                              <span>Reject</span>
                            </Button>
                          </div>
                        )}
                        {app.status === 'accepted' && (
                          <div className="flex items-center gap-2 w-full lg:mt-4">
                            <Button
                              variant="primary"
                              size="sm"
                              loading={actioningId === app.id}
                              onClick={() => handleStartWork(app.id)}
                              className="flex-1 flex items-center justify-center space-x-1 bg-blue-600 hover:bg-blue-700 border-none shadow-sm text-white"
                            >
                              <Check size={16} />
                              <span>Start Work</span>
                            </Button>
                          </div>
                        )}

                        {app.status === 'in_progress' && (
                          <div className="flex items-center gap-2 w-full lg:mt-4">
                            <Button
                              variant="primary"
                              size="sm"
                              loading={actioningId === app.id}
                              onClick={() => handleCompleteWork(app.id)}
                              className="flex-1 flex items-center justify-center space-x-1 bg-emerald-600 hover:bg-emerald-700 border-none shadow-sm text-white"
                            >
                              <Check size={16} />
                              <span>Mark Completed</span>
                            </Button>
                          </div>
                        )}

                        {app.status === 'completed' && !app.reviewed && (
                          <div className="flex items-center gap-2 w-full lg:mt-4">
                            <Button
                              variant="primary"
                              size="sm"
                              loading={actioningId === app.id}
                              onClick={() => handleGiveReview(app.id, app.worker_name)}
                              className="flex-1 flex items-center justify-center space-x-1 bg-amber-600 hover:bg-amber-700 border-none shadow-sm text-white"
                            >
                              <Star size={16} />
                              <span>Give Rating</span>
                            </Button>
                          </div>
                        )}
                      </div>

                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      ) : (
        <Card className="text-center py-16">
          <div className="flex flex-col items-center justify-center space-y-3 text-gray-500">
            <Briefcase size={48} className="text-gray-300 animate-pulse" />
            <p className="text-xl font-bold text-gray-700 dark:text-gray-300">No applicants yet</p>
            <p className="text-sm text-gray-400 max-w-sm">When workers apply to this job posting, they will show up here for your selection review.</p>
            <Button variant="outline" size="sm" onClick={() => navigate('/manage-jobs')} className="mt-2">
              Back to Job Manager
            </Button>
          </div>
        </Card>
      )}

      {/* Review Modal */}
      <ReviewModal
        isOpen={reviewModal.open}
        onClose={handleCloseReviewModal}
        onSubmit={handleSubmitReview}
        workerName={reviewModal.workerName}
        isSubmitting={reviewSubmitting}
      />
    </motion.div>
  )
}

export default ViewApplicants
