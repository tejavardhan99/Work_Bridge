import React from 'react'
import { CheckCircle, Clock, AlertCircle, XCircle, Play, Award } from 'lucide-react'

const StatusBadge = ({ status, size = 'md', showIcon = true }) => {
  const getConfig = (s) => {
    const configs = {
      pending: {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-700',
        icon: Clock,
        label: 'Pending',
        darkBg: 'dark:bg-amber-950',
        darkBorder: 'dark:border-amber-800',
        darkText: 'dark:text-amber-300',
      },
      accepted: {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        text: 'text-emerald-700',
        icon: CheckCircle,
        label: 'Accepted',
        darkBg: 'dark:bg-emerald-950',
        darkBorder: 'dark:border-emerald-800',
        darkText: 'dark:text-emerald-300',
      },
      in_progress: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-700',
        icon: Play,
        label: 'In Progress',
        darkBg: 'dark:bg-blue-950',
        darkBorder: 'dark:border-blue-800',
        darkText: 'dark:text-blue-300',
      },
      completed: {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        text: 'text-purple-700',
        icon: Award,
        label: 'Completed',
        darkBg: 'dark:bg-purple-950',
        darkBorder: 'dark:border-purple-800',
        darkText: 'dark:text-purple-300',
      },
      rejected: {
        bg: 'bg-rose-50',
        border: 'border-rose-200',
        text: 'text-rose-700',
        icon: XCircle,
        label: 'Rejected',
        darkBg: 'dark:bg-rose-950',
        darkBorder: 'dark:border-rose-800',
        darkText: 'dark:text-rose-300',
      },
      cancelled: {
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        text: 'text-gray-700',
        icon: XCircle,
        label: 'Cancelled',
        darkBg: 'dark:bg-gray-900',
        darkBorder: 'dark:border-gray-700',
        darkText: 'dark:text-gray-300',
      },
    }
    return configs[s] || configs.pending
  }

  const config = getConfig(status)
  const Icon = config.icon
  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium transition-colors
        ${sizeClasses[size]}
        ${config.bg} ${config.border} ${config.text}
        ${config.darkBg} ${config.darkBorder} ${config.darkText}`}
    >
      {showIcon && <Icon size={size === 'sm' ? 14 : size === 'md' ? 16 : 18} />}
      {config.label}
    </div>
  )
}

export default StatusBadge
