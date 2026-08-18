import { Toaster } from 'react-hot-toast'
import { useEffect } from 'react'
import { useAuthStore, useUIStore } from './context/store'
import AppRoutes from './routes'
import './App.css'

function App() {
  const { darkMode, setDarkMode, fetchNotifications } = useUIStore()
  const { isAuthenticated } = useAuthStore();
  useEffect(() => {
    // Apply saved theme on app load
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode, setDarkMode])

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications().catch((error) => {
        console.error('Global notifications fetch failed:', error)
      })
    }
  }, [isAuthenticated, fetchNotifications])

  return (
    <>
      <AppRoutes />
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            style: {
              background: '#10b981',
            },
          },
          error: {
            duration: 4000,
            style: {
              background: '#ef4444',
            },
          },
        }}
      />
    </>
  )
}

export default App
