'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, Phone, User, Eye, EyeOff, Loader2, AlertCircle, Shield, Zap, Users, TrendingUp, CheckCircle, Gift } from 'lucide-react'
import { useAuth } from '../../components/AuthProvider'
import { Logo } from '../../components/Logo'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  const { signUp, signInWithGoogle } = useAuth()
  const router = useRouter()

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password || !phone || !fullName) {
      setError('Please fill in all fields')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (phone.length < 10) {
      setError('Please enter a valid phone number')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await signUp(email, password, phone, fullName)
      
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setTimeout(() => {
          router.push('/platform')
        }, 2000)
      }
    } catch (error) {
      setError('Signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    setLoading(true)
    setError('')

    try {
      const result = await signInWithGoogle()
      
      if (result.error) {
        setError(result.error)
      }
    } catch (error) {
      setError('Google signup failed. Please try again.')
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-quark-grey font-inter mb-4">Account Created!</h1>
          <p className="text-slate-600 font-inter mb-6">
            Your account has been created successfully. Redirecting to platform...
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-quark-blue mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left Panel - Product Information */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-quark-blue to-quark-purple relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 flex flex-col justify-center px-12 py-16 text-white">
          <Logo size="lg" className="mb-12 text-white" />
          
          <h1 className="text-4xl font-bold mb-6 font-inter">
            Join 500+ D2C Brands<br />Fighting Fraud
          </h1>
          
          <p className="text-xl mb-12 text-blue-100 font-inter leading-relaxed">
            Start with 500 free credits and protect your business from fraudulent customers, 
            fake returns, and chargebacks with AI-powered risk assessment.
          </p>

          <div className="space-y-8">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Gift className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2 font-inter">500 Free Credits</h3>
                <p className="text-blue-100 font-inter">Get started immediately with generous free credits to test our platform.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2 font-inter">Instant Setup</h3>
                <p className="text-blue-100 font-inter">Create your account in under 2 minutes and start protecting your business today.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2 font-inter">Proven Results</h3>
                <p className="text-blue-100 font-inter">Reduce fraud losses by 85% and improve customer approval rates.</p>
              </div>
            </div>
          </div>

          <div className="mt-12 p-6 bg-white/10 rounded-lg backdrop-blur-sm">
            <div className="flex items-center space-x-2 mb-2">
              <Users className="h-5 w-5" />
              <span className="font-semibold font-inter">🎉 Special Launch Offer</span>
            </div>
            <p className="text-sm text-blue-100 font-inter">
              Sign up now and get 500 free credits plus early access to our premium features.
            </p>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-white/5 rounded-full blur-lg"></div>
      </div>

      {/* Right Panel - Signup Form */}
      <div className="flex-1 flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Logo size="lg" className="justify-center" />
          </div>
          
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-quark-grey font-inter">Create Account</h2>
            <p className="text-slate-600 mt-2 font-inter">Get started with QuarkfinAI today</p>
          </div>

          {/* Google Sign Up */}
          <button
            onClick={handleGoogleSignup}
            disabled={loading}
            className="w-full bg-white border border-slate-300 text-slate-700 py-3 px-4 rounded-lg font-medium hover:bg-slate-50 transition-colors flex items-center justify-center space-x-3 mb-6 font-inter"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-slate-50 text-slate-500 font-inter">Or sign up with email</span>
            </div>
          </div>

          {/* Email Signup Form */}
          <form onSubmit={handleEmailSignup} className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-2 font-inter">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-quark-blue focus:border-transparent font-inter"
                  placeholder="Enter your full name"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2 font-inter">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-quark-blue focus:border-transparent font-inter"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2 font-inter">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-quark-blue focus:border-transparent font-inter"
                  placeholder="+1 (555) 123-4567"
                  required
                />
              </div>
              <p className="text-xs text-slate-500 mt-1 font-inter">
                Required for account verification and abuse prevention
              </p>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2 font-inter">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-quark-blue focus:border-transparent font-inter"
                  placeholder="Create a password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-inter">
                At least 6 characters
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <p className="text-sm text-red-700 font-inter">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-quark-blue text-white py-3 px-4 rounded-lg font-semibold hover:bg-quark-purple transition-colors flex items-center justify-center space-x-2 font-inter"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <span>Create Account</span>
              )}
            </button>
          </form>

          {/* Free Credits Highlight */}
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center space-x-2 mb-1">
              <Gift className="h-4 w-4 text-green-600" />
              <span className="text-sm font-semibold text-green-700 font-inter">500 Free Credits Included!</span>
            </div>
            <p className="text-xs text-green-600 font-inter">
              Start creating risk assessments immediately
            </p>
          </div>

          {/* Terms */}
          <p className="text-xs text-slate-500 text-center mt-4 font-inter">
            By creating an account, you agree to our{' '}
            <Link href="/terms" className="text-quark-blue hover:text-quark-purple">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-quark-blue hover:text-quark-purple">
              Privacy Policy
            </Link>
          </p>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600 font-inter">
              Already have an account?{' '}
              <Link 
                href="/login"
                className="text-quark-blue hover:text-quark-purple font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
