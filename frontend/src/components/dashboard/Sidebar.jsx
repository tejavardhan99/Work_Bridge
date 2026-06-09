import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Home,
  Briefcase,
  CheckSquare,
  Users,
  Settings,
  LogOut,
  Menu,
  Zap,
  ChevronRight,
} from 'lucide-react'
import { useUIStore } from '../../context/store'
import { useAuthStore } from '../../context/store'
import { motion } from 'framer-motion'
import LogoutModal from '../common/LogoutModal'

const Sidebar = () => {
  const location = useLocation()
  const { toggleSidebar, sidebarOpen, darkMode } = useUIStore()
  const { userRole, logout } = useAuthStore()
  const navigate = useNavigate()
  const [isLogoutOpen, setIsLogoutOpen] = useState(false)

  const openLogoutModal = () => {
    setIsLogoutOpen(true)
  }

  const confirmLogout = () => {
    logout()
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setIsLogoutOpen(false)
    navigate('/login')
  }

  const getMenuItems = () => {
    const commonItems = [
      { icon: Home, label: 'Dashboard', path: '/dashboard', roles: ['worker', 'employer', 'admin'] },
      { icon: Zap, label: 'Notifications', path: '/notifications', roles: ['worker', 'employer'] },
      { icon: Settings, label: 'Profile', path: '/profile', roles: ['worker', 'employer'] },
    ]

    const workerItems = [
      { icon: Briefcase, label: 'Find Jobs', path: '/dashboard/worker', roles: ['worker'] },
      { icon: CheckSquare, label: 'Applied', path: '/applied-jobs', roles: ['worker'] },
      { icon: Zap, label: 'Recommended', path: '/recommendations', roles: ['worker'] },
    ]

    const employerItems = [
      { icon: Briefcase, label: 'Post Job', path: '/post-job', roles: ['employer'] },
      { icon: Users, label: 'Manage Jobs', path: '/manage-jobs', roles: ['employer'] },
      { icon: CheckSquare, label: 'Applications', path: '/applications', roles: ['employer'] },
    ]

    const adminItems = [
      { icon: Users, label: 'Admin Dashboard', path: '/admin-dashboard', roles: ['admin'] },
    ]

    let items = [...commonItems]
    if (userRole === 'worker') items.push(...workerItems)
    if (userRole === 'employer') items.push(...employerItems)
    if (userRole === 'admin') items.push(...adminItems)

    return items.filter((item) => item.roles.includes(userRole))
  }

  const menuItems = getMenuItems()
  const isActive = (path) => location.pathname.startsWith(path)

  const sidebarVariants = {
    open: { width: 240 },
    closed: { width: 80 },
  }

  const labelVariants = {
    open: { opacity: 1, width: 'auto' },
    closed: { opacity: 0, width: 0 },
  }

  return (
    <motion.div
      animate={sidebarOpen ? 'open' : 'closed'}
      variants={sidebarVariants}
      transition={{ duration: 0.3 }}
      className={`flex flex-col h-full p-4 ${
        darkMode
          ? 'bg-gray-800 border-r border-gray-700'
          : 'bg-gradient-to-b from-gray-50 to-gray-100 border-r border-gray-200'
      }`}
    >
      {/* Logo */}
      <motion.div layout className="flex items-center justify-between mb-8">
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center space-x-2"
          >
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="w-8 h-8 bg-gradient-to-br from-primary-600 to-blue-600 rounded-lg"
            />
            <span className={`font-bold text-lg ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              WorkBridge
            </span>
          </motion.div>
        )}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleSidebar}
          className={`p-2 rounded-lg transition ${
            darkMode
              ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200'
              : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'
          }`}
        >
          <Menu size={20} />
        </motion.button>
      </motion.div>

      {/* Menu Items */}
      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.path)
          return (
            <motion.div key={item.path} layout>
              <Link
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition group relative ${
                  active
                    ? darkMode
                      ? 'bg-primary-600 text-white shadow-lg'
                      : 'bg-gradient-primary text-white shadow-lg'
                    : darkMode
                    ? 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                    : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                }`}
                title={!sidebarOpen ? item.label : ''}
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="flex-shrink-0"
                >
                  <Icon size={20} />
                </motion.div>
                <motion.span
                  variants={labelVariants}
                  animate={sidebarOpen ? 'open' : 'closed'}
                  className="text-sm font-medium whitespace-nowrap"
                >
                  {item.label}
                </motion.span>
                {active && sidebarOpen && (
                  <motion.div
                    layoutId="active-indicator"
                    className="absolute right-2"
                  >
                    <ChevronRight size={18} />
                  </motion.div>
                )}
              </Link>
            </motion.div>
          )
        })}
      </nav>

      {/* Logout */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={openLogoutModal}
        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition w-full font-medium ${
          darkMode
            ? 'text-red-400 hover:bg-red-900/20 hover:text-red-300'
            : 'text-red-600 hover:bg-red-50 hover:text-red-700'
        }`}
        title={!sidebarOpen ? 'Logout' : ''}
      >
        <LogOut size={20} className="flex-shrink-0" />
        <motion.span
          variants={labelVariants}
          animate={sidebarOpen ? 'open' : 'closed'}
          className="text-sm whitespace-nowrap"
        >
          Logout
        </motion.span>
      </motion.button>
      <LogoutModal
        isOpen={isLogoutOpen}
        onClose={() => setIsLogoutOpen(false)}
        onConfirm={confirmLogout}
      />
    </motion.div>
  )
}

export default Sidebar

