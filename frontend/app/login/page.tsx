'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, Phone, Eye, EyeOff, Loader2, AlertCircle, Shield, Zap, Users, TrendingUp } from 'lucide-react'
import { useAuth } from '../../components/AuthProvider'
import { Logo } from '../../components/Logo'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [requiresPhoneVerification, setRequiresPhoneVerification] = useState(false)
  
  const { signIn, signInWithGoogle } = useAuth()
  const router = useRouter()

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }

    if (requiresPhoneVerification && !phone) {
      setError('Phone verification required for this account')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await signIn(email, password)
      
      if (result.error) {
        if (result.error.includes('phone') || result.error.includes('verification')) {
          setRequiresPhoneVerification(true)
          setError('This account requires phone verification. Please enter your phone number.')
        } else {
          setError(result.error)
        }
      } else {
        router.push('/platform')
      }
    } catch (error) {
      setError('Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError('')

    try {
      const result = await signInWithGoogle()
      
      if (result.error) {
        setError(result.error)
      }
    } catch (error) {
      setError('Google login failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left Panel - Product Information */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-quark-blue to-quark-purple relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 flex flex-col justify-center px-12 py-16 text-white">
          <Logo size="lg" className="mb-12 text-white" />
          
          <h1 className="text-4xl font-bold mb-6 font-inter">
            Protect Commerce,<br />Enable Growth
          </h1>
          
          <p className="text-xl mb-12 text-blue-100 font-inter leading-relaxed">
            AI-powered fraud prevention platform helping D2C brands stop fraudulent customers, 
            fake returns, and chargebacks before they cause damage.
          </p>

          <div className="space-y-8">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2 font-inter">Advanced Risk Assessment</h3>
                <p className="text-blue-100 font-inter">15-25 second comprehensive analysis with 20+ risk factors and AI-powered insights.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2 font-inter">Real-time Protection</h3>
                <p className="text-blue-100 font-inter">Instant fraud detection and automated risk scoring for immediate decision making.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2 font-inter">Business Growth</h3>
                <p className="text-blue-100 font-inter">Reduce chargebacks by 80% while maintaining customer approval rates.</p>
              </div>
            </div>
          </div>

          <div className="mt-12 p-6 bg-white/10 rounded-lg backdrop-blur-sm">
            <div className="flex items-center space-x-2 mb-2">
              <Users className="h-5 w-5" />
              <span className="font-semibold font-inter">Trusted by 500+ D2C Brands</span>
            </div>
            <p className="text-sm text-blue-100 font-inter">
              Join leading e-commerce companies using QuarkfinAI to protect their business and enable growth.
            </p>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-white/5 rounded-full blur-lg"></div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Logo size="lg" className="justify-center" />
          </div>
          
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-quark-grey font-inter">Welcome Back</h2>
            <p className="text-slate-600 mt-2 font-inter">Sign in to your QuarkfinAI account</p>
          </div>

          {/* Google Sign In */}
          <button
            onClick={handleGoogleLogin}
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
              <span className="px-3 bg-slate-50 text-slate-500 font-inter">Or continue with email</span>
            </div>
          </div>

          {/* Email Login Form */}
          <form onSubmit={handleEmailLogin} className="space-y-5">
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
                  placeholder="Enter your password"
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
            </div>

            {/* Phone Verification Field (shows when required) */}
            {requiresPhoneVerification && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2 font-inter">
                  Phone Number (Verification Required)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-quark-blue focus:border-transparent font-inter"
                    placeholder="Enter your phone number"
                    required
                  />
                </div>
                <p className="text-xs text-blue-700 mt-2 font-inter">
                  This account requires phone verification for enhanced security
                </p>
              </div>
            )}

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
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Links */}
          <div className="mt-6 text-center space-y-3">
            <Link 
              href="/auth/reset-password"
              className="text-sm text-quark-blue hover:text-quark-purple font-inter"
            >
              Forgot your password?
            </Link>
            
            <p className="text-sm text-slate-600 font-inter">
              Don't have an account?{' '}
              <Link 
                href="/signup"
                className="text-quark-blue hover:text-quark-purple font-medium"
              >
                Sign up for free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
