import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { workerAPI } from '../services/api'
import toast from 'react-hot-toast'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import StatusBadge from '../components/common/StatusBadge'
import { MapPin, Clock, IndianRupee, Briefcase, ArrowRight } from 'lucide-react'

const AppliedJobs = () => {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadApplications()
    const interval = setInterval(loadApplications, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const loadApplications = async () => {
    try {
      const response = await workerAPI.getApplications()
      setApplications(response.results || [])
    } catch (error) {
      console.error('Failed to load applications', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusTimeline = (status) => {
    const steps = [
      { key: 'pending', label: 'Applied', completed: ['pending', 'accepted', 'in_progress', 'completed'] },
      { key: 'accepted', label: 'Accepted', completed: ['accepted', 'in_progress', 'completed'] },
      { key: 'in_progress', label: 'In Progress', completed: ['in_progress', 'completed'] },
      { key: 'completed', label: 'Completed', completed: ['completed'] },
    ]
    return steps
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">My Applications</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">Track the status of your job applications and completed work</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : applications.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {applications.map((app) => {
            const formattedDate = new Date(app.applied_at || app.created_at).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })
            const jobLocation = app.job?.location?.address || app.job?.location?.village || app.job?.location?.district || app.job?.location?.state || 'Location unlisted'
            const timeline = getStatusTimeline(app.status)

            return (
              <Card key={app.id} hover className="overflow-hidden transition-all duration-300 border border-gray-100 dark:border-gray-800 hover:border-primary-100 shadow-sm">
                {/* Main Content */}
                <div className="p-6 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                          {app.job?.title || app.job_title || 'Job title unavailable'}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 text-sm font-medium text-primary-600 dark:text-primary-400">
                          <Briefcase size={14} />
                          <span>{app.job?.employer_name || 'Employer Profile'}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <div className="flex items-center space-x-1">
                          <MapPin size={16} className="text-gray-400 flex-shrink-0" />
                          <span className="truncate">{jobLocation}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <IndianRupee size={16} className="text-gray-400 flex-shrink-0" />
                          <span>₹{app.job?.salary || 0}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock size={16} className="text-gray-400 flex-shrink-0" />
                          <span>{app.job?.duration || 'Flexible'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <StatusBadge status={app.status} size="md" />
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-3">WORKFLOW STATUS</p>
                    <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
                      {timeline.map((step, idx) => (
                        <div key={step.key} className="flex items-center flex-shrink-0">
                          <div className={`
                            w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                            transition-all
                            ${step.completed.includes(app.status)
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                              : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                            }
                          `}>
                            {idx + 1}
                          </div>
                          {idx < timeline.length - 1 && (
                            <div className={`
                              w-6 h-0.5 mx-1
                              ${step.completed.includes(app.status)
                                ? 'bg-emerald-300 dark:bg-emerald-700'
                                : 'bg-gray-300 dark:bg-gray-600'
                              }
                            `} />
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-4 gap-2 mt-2 text-xs text-center">
                      {timeline.map((step) => (
                        <span
                          key={step.key}
                          className={`
                            truncate
                            ${step.completed.includes(app.status)
                              ? 'text-emerald-700 dark:text-emerald-300 font-medium'
                              : 'text-gray-600 dark:text-gray-400'
                            }
                          `}
                        >
                          {step.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {app.status === 'completed' && '✅ Work completed! Check your profile for rating.'}
                    {app.status === 'in_progress' && '⏳ Work in progress...'}
                    {app.status === 'accepted' && '✔️ You accepted! Waiting to start work.'}
                    {app.status === 'pending' && '⏱️ Awaiting employer response...'}
                    {app.status === 'rejected' && '❌ Application rejected'}
                    {app.status === 'cancelled' && '⛔ Application cancelled'}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/jobs/${app.job?.id || app.job_id}`)}
                    className="flex items-center gap-2"
                  >
                    View <ArrowRight size={14} />
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="text-center py-12">
          <div className="flex flex-col items-center justify-center space-y-3 text-gray-500">
            <Briefcase size={40} className="text-gray-300 animate-pulse" />
            <p className="text-lg font-medium">No applications found</p>
            <p className="text-sm text-gray-400 max-w-sm">Browse jobs and apply to start your work journey.</p>
            <Button variant="primary" size="sm" onClick={() => navigate('/dashboard/worker')} className="mt-2">
              Browse Jobs
            </Button>
          </div>
        </Card>
      )}
    </motion.div>
  )
}

export default AppliedJobs
