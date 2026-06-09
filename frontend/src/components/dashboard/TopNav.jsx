import { User, Moon, Sun, Menu } from 'lucide-react'
import { useUIStore } from '../../context/store'
import { useAuthStore } from '../../context/store'
import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import NotificationDropdown from '../common/NotificationDropdown'

const TopNav = () => {
  const { darkMode, toggleDarkMode, toggleSidebar } = useUIStore()
  const { user } = useAuthStore()

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="px-4 md:px-8 py-4 flex items-center justify-between">
        {/* Left - Menu Toggle */}
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition md:hidden"
        >
          <Menu size={20} className="text-gray-600 dark:text-gray-300" />
        </button>

        {/* Right - Icons & User */}
        <div className="flex items-center space-x-4 ml-auto">
          {/* Notifications */}
          <NotificationDropdown />

          {/* Dark Mode Toggle */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            onClick={toggleDarkMode}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
            title={darkMode ? 'Light mode' : 'Dark mode'}
          >
            {darkMode ? (
              <Sun size={20} className="text-yellow-500" />
            ) : (
              <Moon size={20} className="text-gray-600" />
            )}
          </motion.button>

          {/* User Profile */}
          <Link
            to="/profile"
            className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
          >
            <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center text-white text-sm font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block">
              {user?.name || 'User'}
            </span>
          </Link>
        </div>
      </div>
    </nav>
  )
}

export default TopNav

