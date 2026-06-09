import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { employerAPI } from '../services/api'
import { useUIStore } from '../context/store'
import toast from 'react-hot-toast'
import { Search, Filter, RefreshCcw, CheckCircle2, XCircle, Play, Check, ArrowRightCircle } from 'lucide-react'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import StatusBadge from '../components/common/StatusBadge'

const PAGE_SIZE = 20
const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
]
const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'status', label: 'Status' },
  { value: 'worker_name', label: 'Worker name' },
  { value: 'job_title', label: 'Job title' },
]

const EmployerApplications = () => {
  const navigate = useNavigate()
  const { fetchNotifications } = useUIStore()
  const [applications, setApplications] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [sort, setSort] = useState('newest')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actioningId, setActioningId] = useState(null)

  useEffect(() => {
    loadApplications()
  }, [page, status, sort, searchTerm])

  const loadApplications = async () => {
    console.log('EmployerApplications Component Loaded', { page, status, sort, searchTerm })
    try {
      setError('')
      setLoading(true)
      const params = {
        page,
        page_size: PAGE_SIZE,
        sort,
      }
      if (status) params.status = status
      if (searchTerm) params.search = searchTerm
      const response = await employerAPI.getAllApplications(params)
      console.log('Applications API Response:', response)
      const payload = response?.results || response?.applications ? response : response?.data ? response.data : response
      setApplications(payload.results || payload.applications || [])
      setTotal(payload.total || payload.count || payload.total_count || 0)
      console.log('Applications State after load:', payload)
    } catch (error) {
      console.error('Failed to load applications', error)
      setError('Failed to load applications')
      toast.error('Failed to load applications')
    } finally {
      setLoading(false)
    }
  }

  const handleSearchSubmit = (event) => {
    event.preventDefault()
    setPage(1)
    setSearchTerm(searchQuery.trim())
  }

  const handleAction = async (applicationId, action) => {
    try {
      setActioningId(applicationId)
      if (action === 'accept') {
        await employerAPI.acceptApplication(applicationId)
        toast.success('Application accepted')
      } else if (action === 'reject') {
        await employerAPI.rejectApplication(applicationId)
        toast.success('Application rejected')
      } else if (action === 'start') {
        await employerAPI.startWork(applicationId)
        toast.success('Work started')
      } else if (action === 'complete') {
        await employerAPI.completeWork(applicationId)
        toast.success('Work marked completed')
      }
      await fetchNotifications().catch((error) => {
        console.error('EmployerApplications notification refresh failed:', error)
      })
      loadApplications()
    } catch (error) {
      console.error('Application action failed', error)
      toast.error('Failed to update application status')
    } finally {
      setActioningId(null)
    }
  }

  const renderActions = (application) => {
    if (application.status === 'pending') {
      return (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="primary"
            size="sm"
            loading={actioningId === application.id}
            onClick={() => handleAction(application.id, 'accept')}
          >
            <CheckCircle2 size={16} /> Accept
          </Button>
          <Button
            variant="danger"
            size="sm"
            loading={actioningId === application.id}
            onClick={() => handleAction(application.id, 'reject')}
          >
            <XCircle size={16} /> Reject
          </Button>
        </div>
      )
    }
    if (application.status === 'accepted') {
      return (
        <Button
          variant="primary"
          size="sm"
          loading={actioningId === application.id}
          onClick={() => handleAction(application.id, 'start')}
        >
          <Play size={16} /> Start Work
        </Button>
      )
    }
    if (application.status === 'in_progress') {
      return (
        <Button
          variant="primary"
          size="sm"
          loading={actioningId === application.id}
          onClick={() => handleAction(application.id, 'complete')}
        >
          <Check size={16} /> Complete
        </Button>
      )
    }
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate(`/jobs/${application.job_id}`)}
      >
        <ArrowRightCircle size={16} /> View Job
      </Button>
    )
  }

  console.log('Rendering EmployerApplications', {
    loading,
    error,
    total,
    applicationsLength: applications.length,
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">Applications</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Review and manage applications across all your jobs from one place.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setSearchQuery('')
              setSearchTerm('')
              setStatus('')
              setSort('newest')
              setPage(1)
            }}
          >
            <RefreshCcw size={16} /> Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/manage-jobs')}
          >
            Manage Jobs
          </Button>
        </div>
      </div>

      <Card>
        <div className="grid gap-4 md:grid-cols-3">
          <form onSubmit={handleSearchSubmit} className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Search applicants</label>
            <div className="mt-2 flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by worker or job title"
                className="flex-1 px-4 py-3 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none"
              />
              <Button type="submit" variant="primary" size="sm" className="rounded-none rounded-r-lg">
                <Search size={16} /> Search
              </Button>
            </div>
          </form>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Status</label>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1) }}
              className="mt-2 w-full rounded-lg border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Sort by</label>
            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1) }}
              className="mt-2 w-full rounded-lg border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Showing {applications.length} of {total} applications</p>
            {searchTerm && <p className="text-sm text-gray-500 dark:text-gray-400">Search term: <span className="font-medium text-gray-700 dark:text-gray-200">{searchTerm}</span></p>}
          </div>
          <div className="flex flex-wrap gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="inline-flex items-center gap-1">
              <Filter size={16} />
              {status ? `Filtered: ${status}` : 'All statuses'}
            </span>
            <span className="inline-flex items-center gap-1">
              <ArrowRightCircle size={16} />
              Sorted: {sort}
            </span>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">Loading applications...</p>
        </div>
      ) : error ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">Error loading applications</p>
            <p className="text-sm text-red-600 dark:text-red-400 mt-2">{error}</p>
          </div>
        </Card>
      ) : applications.length > 0 ? (
        <div className="space-y-4">
          {applications.map((application) => (
            <Card key={application.id} hover>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{application.worker_name || 'Unnamed worker'}</h2>
                    <StatusBadge status={application.status} />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Applied for <strong>{application.job_title || 'Unknown job'}</strong></p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Submitted on {new Date(application.applied_at || application.created_at).toLocaleDateString()}</p>
                  {application.cover_note && (
                    <p className="text-sm text-gray-600 dark:text-gray-300">Cover note: {application.cover_note}</p>
                  )}
                  <div className="flex flex-wrap gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <span>{application.worker_location?.address || 'Location unavailable'}</span>
                    <span>{application.worker_phone || 'Phone unavailable'}</span>
                    <span>{application.worker_rating ? `Rating ${application.worker_rating}` : 'No rating yet'}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 items-start sm:items-end">
                  <div className="inline-flex flex-wrap gap-2">
                    {application.worker_skills?.slice(0, 5).map((skill) => (
                      <span key={skill} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-200">{skill}</span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 justify-end">
                    {renderActions(application)}
                  </div>
                </div>
              </div>
            </Card>
          ))}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">Page {page} of {Math.max(1, Math.ceil(total / PAGE_SIZE))}</p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              >
                Previous
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={page >= Math.ceil(total / PAGE_SIZE)}
                onClick={() => setPage((prev) => prev + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Card>
          <div className="text-center py-12">
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">No applications found</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Adjust your filters or post more jobs to see new applications.</p>
          </div>
        </Card>
      )}
    </motion.div>
  )
}

export default EmployerApplications
