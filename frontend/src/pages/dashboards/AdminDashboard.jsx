import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  Users,
  Briefcase,
  CheckCircle2,
  MapPin,
  Clock,
  TrendingUp,
  Activity,
  ListChecks,
  FileCheck,
  XCircle,
  Award,
} from 'lucide-react'
import { adminAPI } from '../../services/api'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalWorkers: null,
    totalEmployers: null,
    totalJobs: null,
    activeJobs: null,
    totalApplications: null,
    pendingApplications: null,
    acceptedApplications: null,
    rejectedApplications: null,
    totalCompletedJobs: null,
  })
  const [jobsByLocation, setJobsByLocation] = useState([])
  const [topSkills, setTopSkills] = useState([])
  const [workerLevels, setWorkerLevels] = useState({ beginner: null, intermediate: null, expert: null })
  const [recentRegistrations, setRecentRegistrations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    console.log('Admin Dashboard Loaded')
    console.log('Admin dashboard API request: GET /api/v1/admin/dashboard/')
    try {
      setLoading(true)
      const rawResponse = await adminAPI.getDashboardAnalyticsRaw()
      console.log('Admin dashboard API response:', rawResponse.data)
      const response = rawResponse.data?.data || rawResponse.data

      setStats({
        totalWorkers: response.total_workers ?? 0,
        totalEmployers: response.total_employers ?? 0,
        totalJobs: response.total_jobs ?? 0,
        activeJobs: response.active_jobs ?? 0,
        totalApplications: response.total_applications ?? 0,
        pendingApplications: response.pending_applications ?? 0,
        acceptedApplications: response.accepted_applications ?? 0,
        rejectedApplications: response.rejected_applications ?? 0,
        totalCompletedJobs: response.completed_jobs ?? 0,
      })
      setJobsByLocation(
        Object.entries(response.jobs_by_location || {}).map(([location, count]) => ({ location, count }))
      )
      setTopSkills(response.top_skills || [])
      setWorkerLevels(response.worker_levels || { beginner: 0, intermediate: 0, expert: 0 })
      setRecentRegistrations(response.recent_registrations || [])
    } catch (error) {
      console.error('Admin Dashboard failed to load', error)
      toast.error('Failed to load admin dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    { icon: Users, label: 'Total Workers', value: stats.totalWorkers },
    { icon: Briefcase, label: 'Total Employers', value: stats.totalEmployers },
    { icon: TrendingUp, label: 'Total Jobs', value: stats.totalJobs },
    { icon: Activity, label: 'Active Jobs', value: stats.activeJobs },
    { icon: CheckCircle2, label: 'Total Applications', value: stats.totalApplications },
    { icon: ListChecks, label: 'Pending Applications', value: stats.pendingApplications },
    { icon: FileCheck, label: 'Accepted Applications', value: stats.acceptedApplications },
    { icon: XCircle, label: 'Rejected Applications', value: stats.rejectedApplications },
    { icon: Clock, label: 'Completed Jobs', value: stats.totalCompletedJobs },
  ]

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">Admin Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-300">Monitor WorkBridge platform activity and registrations.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                      {stat.value ?? (loading ? 'Loading...' : '-')}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
                    <Icon size={24} />
                  </div>
                </div>
              </Card>
            </motion.div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Worker Growth Statistics</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Beginner, intermediate, and expert worker counts.</p>
            </div>
            <Award size={20} className="text-primary-600" />
          </div>
          {loading ? (
            <div className="text-center py-10">
              <div className="inline-block w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
                <p className="text-sm text-gray-500 dark:text-gray-400">Beginner Workers</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{workerLevels.beginner ?? 0}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
                <p className="text-sm text-gray-500 dark:text-gray-400">Intermediate Workers</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{workerLevels.intermediate ?? 0}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
                <p className="text-sm text-gray-500 dark:text-gray-400">Expert Workers</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{workerLevels.expert ?? 0}</p>
              </div>
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Top Worker Skills</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Most common worker skills across the platform.</p>
            </div>
            <TrendingUp size={20} className="text-primary-600" />
          </div>
          {loading ? (
            <div className="text-center py-10">
              <div className="inline-block w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : topSkills.length ? (
            <div className="space-y-3">
              {topSkills.map((skill) => (
                <div key={skill.skill} className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
                  <p className="text-sm text-gray-700 dark:text-gray-200">{skill.skill}</p>
                  <span className="rounded-full bg-primary-100 px-3 py-1 text-sm font-medium text-primary-700 dark:bg-primary-900 dark:text-primary-200">{skill.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">No skill analytics available.</p>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Jobs by Location</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Top locations with the most jobs.</p>
            </div>
            <MapPin size={20} className="text-primary-600" />
          </div>
          {loading ? (
            <div className="text-center py-10">
              <div className="inline-block w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : jobsByLocation.length ? (
            <div className="space-y-3">
              {jobsByLocation.map((item) => (
                <div key={item.location} className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
                  <p className="text-sm text-gray-700 dark:text-gray-200">{item.location}</p>
                  <span className="rounded-full bg-primary-100 px-3 py-1 text-sm font-medium text-primary-700 dark:bg-primary-900 dark:text-primary-200">{item.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">No location data available.</p>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Recent Registrations</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Latest registered users across the platform.</p>
            </div>
            <TrendingUp size={20} className="text-primary-600" />
          </div>
          {loading ? (
            <div className="text-center py-10">
              <div className="inline-block w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : recentRegistrations.length ? (
            <div className="space-y-3">
              {recentRegistrations.map((user) => (
                <div key={user.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.name || 'Unnamed user'}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {user.phone} • {user.role} • {user.location || 'Unknown location'}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Registered {new Date(user.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">No registrations found.</p>
          )}
        </Card>
      </div>

      <div className="text-right">
        <Button onClick={fetchDashboardData} variant="secondary" size="sm" loading={loading}>
          Refresh stats
        </Button>
      </div>
    </div>
  )
}

export default AdminDashboard
