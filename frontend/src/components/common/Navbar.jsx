import { Link, useNavigate } from 'react-router-dom'
import { Menu, X, LogOut, Moon, Sun } from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '../../context/store'
import { useUIStore } from '../../context/store'
import { motion } from 'framer-motion'
import LogoutModal from './LogoutModal'

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isLogoutOpen, setIsLogoutOpen] = useState(false)
  const { isAuthenticated, logout } = useAuthStore()
  const { darkMode, toggleDarkMode } = useUIStore()
  const navigate = useNavigate()

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

  return (
    <nav className={`${
      darkMode
        ? 'bg-gray-800 border-b border-gray-700'
        : 'bg-white border-b border-gray-200'
    } shadow-md transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="w-8 h-8 bg-gradient-to-br from-primary-600 to-blue-600 rounded-lg"
            />
            <span className={`text-xl font-bold gradient-text ${
              darkMode ? 'text-primary-400' : 'text-primary-600'
            }`}>
              WorkBridge
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className={`hidden md:flex items-center space-x-6 ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            <Link to="/" className={`hover:${darkMode ? 'text-white' : 'text-primary-600'} transition`}>
              Home
            </Link>
            <a href="#features" className={`hover:${darkMode ? 'text-white' : 'text-primary-600'} transition`}>
              Features
            </a>
            <a href="#about" className={`hover:${darkMode ? 'text-white' : 'text-primary-600'} transition`}>
              About
            </a>
          </div>

          {/* Right Section */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Dark Mode Toggle */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              onClick={toggleDarkMode}
              className={`p-2 rounded-lg transition ${
                darkMode
                  ? 'hover:bg-gray-700 text-gray-400'
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
              title={darkMode ? 'Light mode' : 'Dark mode'}
            >
              {darkMode ? (
                <Sun size={20} className="text-yellow-500" />
              ) : (
                <Moon size={20} />
              )}
            </motion.button>

            {/* Auth Buttons */}
            {isAuthenticated ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={openLogoutModal}
                className="flex items-center space-x-2 px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </motion.button>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`px-4 py-2 border rounded-lg transition ${
                    darkMode
                      ? 'text-primary-400 border-primary-400 hover:bg-gray-700'
                      : 'text-primary-600 border-primary-600 hover:bg-primary-50'
                  }`}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-gradient-primary text-white rounded-lg hover:shadow-lg transition"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              onClick={toggleDarkMode}
              className={`p-2 rounded-lg transition ${
                darkMode
                  ? 'hover:bg-gray-700 text-gray-400'
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              {darkMode ? (
                <Sun size={20} className="text-yellow-500" />
              ) : (
                <Moon size={20} />
              )}
            </motion.button>
            <button
              className={`p-2 rounded-lg transition ${
                darkMode
                  ? 'hover:bg-gray-700 text-gray-400'
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`md:hidden pb-4 border-t ${
              darkMode
                ? 'border-gray-700 bg-gray-800'
                : 'border-gray-200 bg-white'
            }`}
          >
            <Link to="/" className={`block py-2 px-4 rounded transition ${
              darkMode
                ? 'text-gray-300 hover:bg-gray-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}>
              Home
            </Link>
            <a href="#features" className={`block py-2 px-4 rounded transition ${
              darkMode
                ? 'text-gray-300 hover:bg-gray-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}>
              Features
            </a>
            <a href="#about" className={`block py-2 px-4 rounded transition ${
              darkMode
                ? 'text-gray-300 hover:bg-gray-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}>
              About
            </a>
            <div className="flex flex-col gap-2 mt-4 px-4">
              {isAuthenticated ? (
                <button
                  onClick={openLogoutModal}
                  className="w-full px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Logout
                </button>
              ) : (
                <>
                  <Link
                    to="/login"
                    className={`block px-4 py-2 text-center rounded-lg transition ${
                      darkMode
                        ? 'text-primary-400 border border-primary-400 hover:bg-gray-700'
                        : 'text-primary-600 border border-primary-600 hover:bg-primary-50'
                    }`}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="block px-4 py-2 text-center bg-gradient-primary text-white rounded-lg hover:shadow-lg"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </div>
      <LogoutModal
        isOpen={isLogoutOpen}
        onClose={() => setIsLogoutOpen(false)}
        onConfirm={confirmLogout}
      />
    </nav>
  )
}

export default Navbar
