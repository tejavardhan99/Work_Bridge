import { useEffect, useRef, useState } from 'react'
import { Bell, X, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { apiClient } from '../../services/api'
import toast from 'react-hot-toast'
import { useUIStore } from '../../context/store'

const NotificationDropdown = () => {
  const {
    notifications,
    notificationsLoading,
    notificationsLoaded,
    notificationDropdownOpen,
    toggleNotificationDropdown,
    closeNotificationDropdown,
    markNotificationAsRead,
    removeNotification,
    fetchNotifications,
  } = useUIStore()
  const [deletingIds, setDeletingIds] = useState([])

  const dropdownRef = useRef(null)
  const unreadCount = notifications.filter((n) => n.unread).length

  useEffect(() => {
    console.log('Navbar Notifications:', notifications)
    if (!notificationsLoading && !notificationsLoaded) {
      fetchNotifications().catch((error) => {
        console.error('Navbar notification fetch failed:', error)
      })
    }
  }, [notifications, notificationsLoading, notificationsLoaded, fetchNotifications])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        closeNotificationDropdown()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [closeNotificationDropdown])

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'job':
        return '💼'
      case 'application':
        return '📋'
      case 'profile':
        return '👤'
      case 'message':
        return '💬'
      default:
        return '🔔'
    }
  }

  const getNotificationColor = (type) => {
    switch (type) {
      case 'job':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
      case 'application':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
      case 'profile':
        return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
      default:
        return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        whileHover={{ scale: 1.1 }}
        onClick={toggleNotificationDropdown}
        className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
      >
        <Bell size={20} className="text-gray-600 dark:text-gray-300" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-0 right-0 w-5 h-5 bg-red-600 text-white text-xs rounded-full flex items-center justify-center font-bold"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </motion.button>

      <AnimatePresence>
        {notificationDropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
          >
            {/* Header */}
            <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Notifications
              </h3>
              <button
                onClick={closeNotificationDropdown}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={18} />
              </button>
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {notificationsLoading || !notificationsLoaded ? (
                <div className="px-4 py-8 text-center">
                  <Bell size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                  <p className="text-gray-500 dark:text-gray-400">Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Bell size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                  <p className="text-gray-500 dark:text-gray-400">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition cursor-pointer ${
                        notification.unread ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                      } ${getNotificationColor(notification.type)}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white text-sm">
                            {notification.title}
                          </p>
                          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            {new Date(notification.timestamp || Date.now()).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          {notification.unread && (
                            <button
                              onClick={(event) => {
                                event.stopPropagation()
                                markNotificationAsRead(notification.id)
                              }}
                              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition"
                              title="Mark as read"
                            >
                              <Check size={14} className="text-blue-600 dark:text-blue-400" />
                            </button>
                          )}
                          <button
                            onClick={async (event) => {
                              event.stopPropagation()
                              console.log('Deleting notification:', notification.id)
                              if (!notification.id) {
                                toast.error('Failed to delete notification')
                                return
                              }

                              setDeletingIds((prev) => [...prev, notification.id])
                              try {
                                await apiClient.delete(`/notifications/${notification.id}/delete/`)
                                removeNotification(notification.id)
                              } catch (error) {
                                toast.error('Failed to delete notification')
                              } finally {
                                setDeletingIds((prev) => prev.filter((id) => id !== notification.id))
                              }
                            }}
                            disabled={deletingIds.includes(notification.id)}
                            className={`p-1 rounded transition ${
                              deletingIds.includes(notification.id)
                                ? 'opacity-50 cursor-not-allowed'
                                : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                            title="Remove"
                          >
                            <X size={14} className="text-gray-500 dark:text-gray-400" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 text-center">
                <button className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium">
                  View all notifications
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default NotificationDropdown
