import axios from 'axios'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      userRole: null,

      setUser: (user) => set({ user }),
      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken, isAuthenticated: true }),
      setUserRole: (role) => set({ userRole: role }),

      login: (user, accessToken, refreshToken, role) =>
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          userRole: role,
        }),

      logout: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          userRole: null,
        })
      },

      updateUser: (userData) =>
        set((state) => ({
          user: { ...state.user, ...userData },
        })),

      updateAccessToken: (token) => set({ accessToken: token }),
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        userRole: state.userRole,
      }),
    }
  )
)

export const useUIStore = create(
  persist(
    (set, get) => ({
      sidebarOpen: true,
      darkMode: false,
      notifications: [],
      notificationsLoaded: false,
      notificationsLoading: false,
      notificationDropdownOpen: false,

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      
      setDarkMode: (dark) => {
        set({ darkMode: dark })
        // Apply to document
        if (dark) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      },

      toggleDarkMode: () => {
        const newValue = !get().darkMode
        get().setDarkMode(newValue)
      },

      toggleNotificationDropdown: () =>
        set((state) => ({ notificationDropdownOpen: !state.notificationDropdownOpen })),

      closeNotificationDropdown: () => set({ notificationDropdownOpen: false }),

      addNotification: (notification) =>
        set((state) => ({
          notifications: [
            ...state.notifications,
            { id: Date.now(), ...notification, unread: true },
          ],
        })),

      markNotificationAsRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, unread: false } : n
          ),
        })),

      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),

      setNotifications: (notifications) => set({ notifications }),

      clearNotifications: () => set({ notifications: [], notificationsLoaded: false }),

      fetchNotifications: async () => {
        set({ notificationsLoading: true })
        try {
          const token = localStorage.getItem('access_token')
          const headers = { 'Content-Type': 'application/json' }
          if (token) headers.Authorization = `Bearer ${token}`
          const response = await axios.get(`${API_BASE_URL}/notifications/`, {
            headers,
          })
          const data = response?.data?.data !== undefined ? response.data.data : response.data
          console.log('Fetched Notifications:', data)
          set({ notifications: data.results || [], notificationsLoaded: true })
          return data
        } catch (error) {
          console.error('Failed to fetch notifications:', error)
          return null
        } finally {
          set({ notificationsLoading: false })
        }
      },
    }),
    {
      name: 'ui-store',
      partialize: (state) => ({
        darkMode: state.darkMode,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
)
