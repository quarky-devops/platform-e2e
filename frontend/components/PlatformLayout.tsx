'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { 
  Home, 
  Shield, 
  Users, 
  CreditCard, 
  Settings, 
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  BarChart3,
  Activity,
  FileText,
  AlertTriangle,
  Store,
  Bot,
  FileCode,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { useAuth } from './AuthProvider'
import { Logo } from './Logo'
import CreditBalance from './CreditBalance'
import PhoneVerificationBanner from './PhoneVerificationBanner'

interface PlatformLayoutProps {
  children: React.ReactNode
}

export default function PlatformLayout({ children }: PlatformLayoutProps) {
  const { user, userProfile, signOut } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [platformExpanded, setPlatformExpanded] = useState(true)
  const [insightsExpanded, setInsightsExpanded] = useState(true)
  const pathname = usePathname()
  const router = useRouter()

  const platformItems = [
    { name: 'Business Risk Prevention', href: '/platform/business-risk', icon: Shield },
    { name: 'Customer Risk Prevention', href: '/platform/customer-risk', icon: Users },
    { name: 'Lending Risk Prevention', href: '/platform/lending-risk', icon: CreditCard },
  ]

  const insightItems = [
    { name: 'Business Intelligence', href: '/platform/insights/business', icon: BarChart3 },
    { name: 'Transaction Monitoring', href: '/platform/insights/transactions', icon: Activity },
    { name: 'Security Logs', href: '/platform/insights/security', icon: AlertTriangle },
    { name: 'Risk Reports', href: '/platform/insights/reports', icon: FileText },
  ]

  const toolItems = [
    { name: 'Marketplace', href: '/platform/marketplace', icon: Store },
    { name: 'AI Assistant', href: '/platform/ai-assistant', icon: Bot },
    { name: 'API Docs', href: '/platform/api-docs', icon: FileCode },
  ]

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const togglePlatform = () => setPlatformExpanded(!platformExpanded)
  const toggleInsights = () => setInsightsExpanded(!insightsExpanded)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-slate-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex flex-col w-full max-w-xs bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          <SidebarContent 
            platformItems={platformItems}
            insightItems={insightItems}
            toolItems={toolItems}
            pathname={pathname} 
            userProfile={userProfile}
            onSignOut={handleSignOut}
            platformExpanded={platformExpanded}
            insightsExpanded={insightsExpanded}
            togglePlatform={togglePlatform}
            toggleInsights={toggleInsights}
          />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0">
        <SidebarContent 
          platformItems={platformItems}
          insightItems={insightItems}
          toolItems={toolItems}
          pathname={pathname} 
          userProfile={userProfile}
          onSignOut={handleSignOut}
          platformExpanded={platformExpanded}
          insightsExpanded={insightsExpanded}
          togglePlatform={togglePlatform}
          toggleInsights={toggleInsights}
        />
      </div>

      {/* Main content */}
      <div className="lg:pl-72 flex flex-col flex-1">
        {/* Top navigation */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 lg:hidden">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              type="button"
              className="text-slate-500 hover:text-slate-600"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <Logo size="sm" />
            <div className="w-6" /> {/* Spacer */}
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Phone Verification Banner */}
              <PhoneVerificationBanner />
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function SidebarContent({ 
  platformItems,
  insightItems,
  toolItems,
  pathname, 
  userProfile, 
  onSignOut,
  platformExpanded,
  insightsExpanded,
  togglePlatform,
  toggleInsights
}: { 
  platformItems: any[],
  insightItems: any[],
  toolItems: any[],
  pathname: string, 
  userProfile: any,
  onSignOut: () => void,
  platformExpanded: boolean,
  insightsExpanded: boolean,
  togglePlatform: () => void,
  toggleInsights: () => void
}) {
  return (
    <div className="flex flex-col flex-grow bg-white border-r border-slate-200">
      {/* Logo */}
      <div className="flex items-center flex-shrink-0 px-6 py-6">
        <Logo size="md" />
      </div>

      {/* User Profile */}
      {userProfile && (
        <div className="px-6 pb-4">
          <a 
            href="/platform/settings"
            className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors group"
          >
            <div className="w-10 h-10 bg-quark-blue bg-opacity-10 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold text-quark-blue font-inter">
                {userProfile.full_name?.charAt(0) || userProfile.email?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate font-inter group-hover:text-quark-blue">
                {userProfile.full_name || 'User'}
              </p>
              <p className="text-xs text-slate-500 truncate font-inter">
                {userProfile.current_plan?.plan_name || 'Free'} Plan
              </p>
            </div>
            <Settings className="h-4 w-4 text-slate-400 group-hover:text-quark-blue" />
          </a>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-6 space-y-1">
        {/* Platform Section */}
        <div className="space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 font-inter">
            PLATFORM
          </div>
          
          <button
            onClick={togglePlatform}
            className="group flex items-center w-full px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors font-inter"
          >
            <Home className="mr-3 h-5 w-5 text-slate-500 group-hover:text-slate-700" />
            Platform
            {platformExpanded ? (
              <ChevronDown className="ml-auto h-4 w-4 text-slate-400" />
            ) : (
              <ChevronRight className="ml-auto h-4 w-4 text-slate-400" />
            )}
          </button>
          
          {platformExpanded && (
            <div className="ml-6 space-y-1">
              {platformItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors font-inter ${
                      isActive
                        ? 'bg-quark-blue text-white'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <item.icon
                      className={`mr-3 h-4 w-4 ${
                        isActive
                          ? 'text-white'
                          : 'text-slate-500 group-hover:text-slate-700'
                      }`}
                    />
                    {item.name}
                  </a>
                )
              })}
            </div>
          )}
        </div>

        {/* Insights Section */}
        <div className="space-y-1 pt-6">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 font-inter">
            INSIGHTS
          </div>
          
          <button
            onClick={toggleInsights}
            className="group flex items-center w-full px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors font-inter"
          >
            <BarChart3 className="mr-3 h-5 w-5 text-slate-500 group-hover:text-slate-700" />
            Insights
            {insightsExpanded ? (
              <ChevronDown className="ml-auto h-4 w-4 text-slate-400" />
            ) : (
              <ChevronRight className="ml-auto h-4 w-4 text-slate-400" />
            )}
          </button>
          
          {insightsExpanded && (
            <div className="ml-6 space-y-1">
              {insightItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors font-inter ${
                      isActive
                        ? 'bg-quark-blue text-white'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <item.icon
                      className={`mr-4 h-4 w-4 ${
                        isActive
                          ? 'text-white'
                          : 'text-slate-500 group-hover:text-slate-700'
                      }`}
                    />
                    {item.name}
                  </a>
                )
              })}
            </div>
          )}
        </div>

        {/* Tools Section */}
        <div className="space-y-1 pt-6">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 font-inter">
            TOOLS
          </div>
          
          {toolItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <a
                key={item.name}
                href={item.href}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors font-inter ${
                  isActive
                    ? 'bg-quark-blue text-white'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 ${
                    isActive
                      ? 'text-white'
                      : 'text-slate-500 group-hover:text-slate-700'
                  }`}
                />
                {item.name}
              </a>
            )
          })}
        </div>
      </nav>

      {/* Credit Balance */}
      <div className="px-6 pb-4">
        <CreditBalance />
      </div>

      {/* Bottom Actions */}
      <div className="flex-shrink-0 px-6 pb-6 space-y-2">
        <a
          href="/platform/settings"
          className="group flex items-center px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors font-inter"
        >
          <Settings className="mr-3 h-5 w-5 text-slate-500 group-hover:text-slate-700" />
          Settings
        </a>
        
        <button
          onClick={onSignOut}
          className="group flex items-center w-full px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors font-inter"
        >
          <LogOut className="mr-3 h-5 w-5 text-slate-500 group-hover:text-slate-700" />
          Sign Out
        </button>
      </div>
    </div>
  )
}
