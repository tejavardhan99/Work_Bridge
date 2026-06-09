import { Outlet } from 'react-router-dom'
import { useUIStore } from '../context/store'
import Sidebar from '../components/dashboard/Sidebar'
import TopNav from '../components/dashboard/TopNav'

const DashboardLayout = () => {
  const { sidebarOpen } = useUIStore()

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 dark:text-white">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-all duration-300 fixed h-full overflow-y-auto z-40`}>
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className={`${sidebarOpen ? 'ml-64' : 'ml-20'} flex-1 flex flex-col transition-all duration-300 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}>
        <TopNav />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
