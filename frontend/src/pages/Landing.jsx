import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  MapPin,
  Briefcase,
  Users,
  TrendingUp,
  CheckCircle,
  ArrowRight,
} from 'lucide-react'

const Landing = () => {
  const features = [
    {
      icon: MapPin,
      title: 'Location-Based Matching',
      description: 'Find jobs near you using real-time location-based recommendations.',
    },
    {
      icon: Briefcase,
      title: 'Verified Opportunities',
      description: 'Access verified job listings from trusted employers in your area.',
    },
    {
      icon: Users,
      title: 'Build Your Network',
      description: 'Connect with employers, showcase your skills, and grow professionally.',
    },
    {
      icon: TrendingUp,
      title: 'AI-Powered Recommendations',
      description: 'Get personalized job recommendations based on your skills and preferences.',
    },
  ]

  const stats = [
    { number: '10K+', label: 'Active Jobs' },
    { number: '5K+', label: 'Workers' },
    { number: '2K+', label: 'Employers' },
    { number: '95%', label: 'Success Rate' },
  ]

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="pt-20 pb-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900">
                Connect Jobs to
                <span className="block gradient-text">Rural Communities</span>
              </h1>
              <p className="text-xl text-gray-600 max-w-md">
                WorkBridge empowers rural workers by connecting them with nearby job opportunities through AI-powered recommendations and location-based matching.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/register"
                className="px-8 py-3 bg-gradient-primary text-white rounded-lg hover:shadow-lg transition text-center font-medium"
              >
                Get Started
              </Link>
              <Link
                to="/login"
                className="px-8 py-3 border-2 border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition text-center font-medium"
              >
                Sign In
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="bg-gradient-primary rounded-2xl p-8 text-white shadow-2xl">
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-lg" />
                  <div className="space-y-1">
                    <p className="font-semibold">Modern Matching Platform</p>
                    <p className="text-sm opacity-75">AI-powered job recommendations</p>
                  </div>
                </div>
                <div className="h-2 bg-white/20 rounded-full" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold">50+</p>
                    <p className="text-sm opacity-75">Skills Tracked</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold">Real-time</p>
                    <p className="text-sm opacity-75">Notifications</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="about" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="space-y-2"
              >
                <p className="text-3xl md:text-4xl font-bold gradient-text">{stat.number}</p>
                <p className="text-gray-600">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl font-bold text-gray-900">Why Choose WorkBridge?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We're revolutionizing how rural workers find and connect with opportunities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white border border-gray-200 rounded-xl p-8 hover:shadow-lg transition"
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Icon size={24} className="text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: 1, title: 'Create Account', desc: 'Sign up as a worker or employer' },
              { step: 2, title: 'Complete Profile', desc: 'Add your skills and preferences' },
              { step: 3, title: 'Get Matched', desc: 'Receive AI-powered recommendations' },
              { step: 4, title: 'Start Working', desc: 'Connect and begin your work' },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative"
              >
                <div className="bg-white rounded-xl p-8 text-center border-2 border-primary-100">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-primary text-white rounded-full font-bold mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
                {index < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="text-primary-600" size={28} />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-primary text-white">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h2 className="text-4xl font-bold">Ready to Find Your Next Opportunity?</h2>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              Join thousands of workers already using WorkBridge to find better opportunities.
            </p>
          </motion.div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="px-8 py-3 bg-white text-primary-600 rounded-lg hover:shadow-lg transition font-medium inline-flex items-center justify-center space-x-2"
            >
              <span>Get Started Now</span>
              <ArrowRight size={20} />
            </Link>
            <Link
              to="/login"
              className="px-8 py-3 border-2 border-white text-white rounded-lg hover:bg-white hover:bg-opacity-10 transition font-medium"
            >
              Sign In to Your Account
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Landing
