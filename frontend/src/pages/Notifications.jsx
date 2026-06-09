import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { apiClient } from '../services/api'
import toast from 'react-hot-toast'
import { Trash2, Bell } from 'lucide-react'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import { useUIStore } from '../context/store'

const Notifications = () => {
  const [deletingIds, setDeletingIds] = useState([])
  const { notifications, notificationsLoading, notificationsLoaded, fetchNotifications, removeNotification } = useUIStore()

  useEffect(() => {
    if (!notificationsLoading && !notificationsLoaded) {
      fetchNotifications().catch((error) => {
        console.error('Notifications page fetch failed:', error)
        toast.error('Failed to load notifications')
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchNotifications, notificationsLoaded, notificationsLoading])

  const handleDelete = async (notificationId) => {
    console.log('Deleting notification:', notificationId)
    if (!notificationId) {
      toast.error('Failed to delete notification')
      return
    }

    setDeletingIds((prev) => [...prev, notificationId])
    try {
      await apiClient.delete(`/notifications/${notificationId}/delete/`)
      removeNotification(notificationId)
      toast.success('Notification deleted')
    } catch (error) {
      toast.error('Failed to delete notification')
    } finally {
      setDeletingIds((prev) => prev.filter((id) => id !== notificationId))
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Notifications</h1>
        <p className="text-gray-600 mt-2">Stay updated with the latest activity</p>
      </div>

      {notificationsLoading || !notificationsLoaded ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : notifications.length > 0 ? (
        <div className="space-y-4">
          {notifications.map((notif) => (
            <Card key={notif.id} hover>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bell size={20} className="text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {notif.title}
                    </h3>
                    <p className="text-gray-600 mt-1">{notif.message}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {new Date(notif.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(notif.id)}
                >
                  <Trash2 size={18} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div className="text-center py-12 space-y-4">
            <Bell size={48} className="mx-auto text-gray-300" />
            <p className="text-gray-600">No notifications yet</p>
          </div>
        </Card>
      )}
    </motion.div>
  )
}

export default Notifications
