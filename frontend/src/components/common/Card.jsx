import { motion } from 'framer-motion'

const Card = ({
  children,
  className = '',
  hover = true,
  onClick = null,
  variant = 'default',
}) => {
  const variants = {
    default: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 shadow-sm',
    dark: 'bg-gray-800 border border-gray-700 text-white',
    glass: 'bg-white/30 dark:bg-gray-800/30 backdrop-blur-md border border-white/20 dark:border-gray-700/20',
    elevated: 'bg-white dark:bg-gray-800 shadow-lg',
  }

  const hoverClass = hover && !onClick ? 'hover:shadow-md transition-shadow' : ''
  const clickClass = onClick ? 'cursor-pointer' : ''

  return (
    <motion.div
      whileHover={hover ? { y: -2 } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      onClick={onClick}
      className={`rounded-lg p-6 ${variants[variant]} ${hoverClass} ${clickClass} ${className}`}
    >
      {children}
    </motion.div>
  )
}

export default Card
