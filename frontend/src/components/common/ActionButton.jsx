import React from 'react'
import { motion } from 'framer-motion'
import {
  Play,
  CheckCircle,
  Star,
  Clock,
  Check,
  X,
} from 'lucide-react'

const ActionButton = ({ action, disabled = false, onClick, loading = false, size = 'md' }) => {
  const getConfig = (act) => {
    const configs = {
      start_work: {
        icon: Play,
        label: 'Start Work',
        color: 'bg-blue-600 hover:bg-blue-700 text-white',
        darkColor: 'dark:bg-blue-600 dark:hover:bg-blue-700',
      },
      complete_work: {
        icon: CheckCircle,
        label: 'Mark Completed',
        color: 'bg-emerald-600 hover:bg-emerald-700 text-white',
        darkColor: 'dark:bg-emerald-600 dark:hover:bg-emerald-700',
      },
      give_rating: {
        icon: Star,
        label: 'Give Rating',
        color: 'bg-amber-600 hover:bg-amber-700 text-white',
        darkColor: 'dark:bg-amber-600 dark:hover:bg-amber-700',
      },
      accept: {
        icon: Check,
        label: 'Accept',
        color: 'bg-emerald-600 hover:bg-emerald-700 text-white',
        darkColor: 'dark:bg-emerald-600 dark:hover:bg-emerald-700',
      },
      reject: {
        icon: X,
        label: 'Reject',
        color: 'bg-rose-600 hover:bg-rose-700 text-white',
        darkColor: 'dark:bg-rose-600 dark:hover:bg-rose-700',
      },
    }
    return configs[act] || configs.start_work
  }

  const config = getConfig(action)
  const Icon = config.icon

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs gap-1',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2',
  }

  const iconSize = {
    sm: 14,
    md: 16,
    lg: 18,
  }

  return (
    <motion.button
      whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center rounded-lg font-medium
        transition-all duration-200
        ${sizeClasses[size]}
        ${config.color} ${config.darkColor}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <Icon size={iconSize[size]} />
      )}
      {config.label}
    </motion.button>
  )
}

export default ActionButton
