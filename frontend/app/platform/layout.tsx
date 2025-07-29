'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { 
  Home, 
  BarChart3, 
  Activity, 
  FileText, 
  Settings, 
  Bot, 
  Book, 
  Store, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp,
  User,
  LogOut,
  Bell,
  Search,
  Loader2,
  Shield
} from 'lucide-react'
import { Logo, AppIcon } from '../../components/Logo'
import { useAuth } from '../../components/AuthProvider'
import PhoneVerificationBanner from '../../components/PhoneVerificationBanner'

interface PlatformLayoutProps {
  children: React.ReactNode
}

export default function PlatformLayout({ children }: PlatformLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, userProfile, signOut, loading } = useAuth()
  
  const [sidebarExpanded, setSidebarExpanded] = useState(true)
  const [platformExpanded, setPlatformExpanded] = useState(true)
  const [insightsExpanded, setInsightsExpanded] = useState(true)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  const handleLogout = async () => {
    try {
      await signOut()
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleMenuClick = (item: any) => {
    if (sidebarExpanded && item.subItems) {
      item.setExpanded(!item.expanded);
    }
  }

  // MAIN SECTIONS
  const mainSections = [
    {
      id: 'platform',
      label: 'Platform',
      icon: Home,
      href: '/platform',
      expanded: platformExpanded,
      setExpanded: setPlatformExpanded,
      subItems: [
        { id: 'business-risk', label: 'Business Risk Prevention', href: '/platform/business-risk' },
        { id: 'customer-risk', label: 'Customer Risk Prevention', href: '/platform/customer-risk' },
        { id: 'lending-risk', label: 'Lending Risk Prevention', href: '/platform/lending-risk' }
      ]
    },
    {
      id: 'insights',
      label: 'Insights',
      icon: BarChart3,
      href: '/platform/insights',
      expanded: insightsExpanded,
      setExpanded: setInsightsExpanded,
      subItems: [
        { id: 'business-intelligence', label: 'Business Intelligence', href: '/platform/insights' },
        { id: 'transaction-monitoring', label: 'Transaction Monitoring', href: '/platform/transactions' },
        { id: 'security-logs', label: 'Security Logs', href: '/platform/logs' },
        { id: 'risk-reports', label: 'Risk Reports', href: '/platform/reports' }
      ]
    }
  ]

  // SINGLE ITEMS
  const singleItems = [
    { id: 'marketplace', label: 'Marketplace', icon: Store, href: '/platform/marketplace' },
    { id: 'ai-support', label: 'AI Assistant', icon: Bot, href: '/platform/ai-support' },
    { id: 'documentation', label: 'API Docs', icon: Book, href: '/platform/documentation' },
    { id: 'settings', label: 'Settings', icon: Settings, href: '/platform/settings' }
  ]

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Logo size="xl" className="mb-6 justify-center" />
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin text-quark-blue" />
            <span className="text-slate-600 font-inter">Loading platform...</span>
          </div>
        </div>
      </div>
    )
  }

  // Don't render if user is not authenticated (will redirect)
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <div className={`${sidebarExpanded ? 'w-64' : 'w-16'} sidebar-transition bg-white border-r border-slate-100 flex flex-col relative`}>
        {/* Sidebar Header */}
        <div className="p-5 border-b border-slate-100">
          <div className={`${!sidebarExpanded ? 'flex justify-center' : ''}`}>
            {sidebarExpanded ? (
              <Logo size="md" />
            ) : (
              <AppIcon size="md" />
            )}
          </div>
        </div>
        
        {/* Collapse Button - Positioned at the edge */}
        <button
          onClick={() => setSidebarExpanded(!sidebarExpanded)}
          className="absolute -right-3.5 top-24 bg-white border border-slate-200 rounded p-0.5 hover:bg-slate-50 transition-all shadow-sm z-10"
        >
          <div className="flex items-center px-0.5">
            <ChevronLeft className={`h-3 w-3 text-slate-500 transition-transform ${!sidebarExpanded ? 'rotate-180' : ''}`} />
            <ChevronLeft className={`h-3 w-3 text-slate-500 transition-transform -ml-1.5 ${!sidebarExpanded ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {/* Sidebar Navigation */}
        <nav className="flex-1 p-3 space-y-6 overflow-y-auto">
          {/* MAIN SECTIONS */}
          <div className="space-y-6">
            {mainSections.map((item) => {
              const Icon = item.icon
              const isActive = item.id === 'platform' && pathname === '/platform'
              
              return (
                <div key={item.id} className="space-y-3">
                  {/* Section Header */}
                  {sidebarExpanded && (
                    <div className="px-3">
                      <h3 className="text-xs font-semibold text-quark-blue uppercase tracking-wider font-inter">
                        {item.label}
                      </h3>
                    </div>
                  )}
                  
                  {/* Main Item */}
                  <div className="flex items-center w-full">
                    <button
                      onClick={() => {
                        if (item.href) {
                          router.push(item.href);
                        }
                        if (sidebarExpanded && item.subItems) {
                          item.setExpanded(!item.expanded);
                        }
                      }}
                      className={`flex-1 flex items-center p-3 rounded-lg transition-all hover:bg-slate-50 group ${
                        isActive ? 'bg-quark-light-blue bg-opacity-10' : ''
                      }`}
                      title={!sidebarExpanded ? item.label : undefined}
                    >
                      <div className="sidebar-icon-wrapper">
                        <Icon className={`h-5 w-5 ${isActive ? 'text-quark-blue' : 'text-slate-600'} group-hover:text-quark-blue`} />
                      </div>
                      {sidebarExpanded && (
                        <>
                          <span className={`ml-3 font-medium ${isActive ? 'text-quark-blue' : 'text-slate-700'} group-hover:text-quark-blue font-inter flex-1`}>
                            {item.label}
                          </span>
                          {item.subItems && (
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMenuClick(item);
                              }}
                              className="p-1 hover:bg-slate-100 rounded cursor-pointer"
                            >
                              <div className="text-slate-400 hover:text-quark-blue">
                                {item.expanded ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </button>
                  </div>
                  
                  {/* Sub Items with connecting line */}
                  {item.expanded && sidebarExpanded && item.subItems && (
                    <div className="relative">
                      {/* Connecting line */}
                      <div className="absolute left-6 top-0 bottom-0 w-px bg-slate-200"></div>
                      
                      <div className="ml-10 mt-1 space-y-0.5">
                        {item.subItems.map((subItem) => {
                          const isSubActive = pathname === subItem.href
                          
                          return (
                            <button
                              key={subItem.id}
                              onClick={() => router.push(subItem.href)}
                              className={`w-full text-left p-2.5 text-sm rounded-lg transition-all font-inter relative ${
                                isSubActive ? 'text-quark-blue bg-slate-50' : 'text-slate-600 hover:text-quark-blue hover:bg-slate-50'
                              }`}
                            >
                              {/* Connecting dot */}
                              <div className="absolute left-[-1.5rem] top-1/2 transform -translate-y-1/2 w-2 h-2 bg-slate-300 rounded-full"></div>
                              {subItem.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Section Separator */}
          {sidebarExpanded && (
            <div className="px-3">
              <hr className="border-slate-200" />
            </div>
          )}

          {/* SINGLE ITEMS */}
          <div className="space-y-3">
            {sidebarExpanded && (
              <div className="px-3">
                <h3 className="text-xs font-semibold text-quark-blue uppercase tracking-wider font-inter">
                  Tools
                </h3>
              </div>
            )}
            
            <div className="space-y-1">
              {singleItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                
                return (
                  <button
                    key={item.id}
                    onClick={() => router.push(item.href)}
                    className={`w-full flex items-center p-3 rounded-lg transition-all hover:bg-slate-50 group ${
                      isActive ? 'bg-quark-light-blue bg-opacity-10' : ''
                    }`}
                    title={!sidebarExpanded ? item.label : undefined}
                  >
                    <div className="sidebar-icon-wrapper">
                      <Icon className={`h-5 w-5 ${isActive ? 'text-quark-blue' : 'text-slate-600'} group-hover:text-quark-blue`} />
                    </div>
                    {sidebarExpanded && (
                      <span className={`ml-3 font-medium ${isActive ? 'text-quark-blue' : 'text-slate-700'} group-hover:text-quark-blue font-inter`}>
                        {item.label}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </nav>

        {/* Sidebar Footer - Brand tagline when expanded */}
        {sidebarExpanded && (
          <div className="p-5 border-t border-slate-100">
            <div className="text-xs text-slate-500 font-inter text-center">
              Protect Commerce, Enable Growth
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-slate-100 px-8 py-5">
          <div className="flex items-center justify-between">
            {/* Search Bar */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search anything..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-quark-blue focus:border-transparent font-inter transition-all"
                />
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center space-x-4">
              {/* Credits Indicator */}
              <div className="hidden sm:block">
                <div className="bg-gradient-to-r from-quark-blue to-quark-purple text-white px-4 py-2 rounded-lg shadow-sm">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      <Shield className="h-4 w-4" />
                    </div>
                    <div className="text-sm font-inter">
                      <span className="font-bold">{userProfile?.credits?.available_credits?.toLocaleString() || '0'}</span>
                      <span className="opacity-90 ml-1">credits</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* API Documentation Link */}
              <button
                onClick={() => router.push('/platform/documentation')}
                className="p-2 rounded-lg hover:bg-slate-50 text-slate-600 hover:text-quark-blue transition-all"
                title="API Documentation"
              >
                <Book className="h-5 w-5" />
              </button>

              {/* Notifications */}
              <button className="p-2 rounded-lg hover:bg-slate-50 text-slate-600 hover:text-quark-blue transition-all relative" title="Notifications">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* User Profile Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center space-x-2 p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-quark-blue to-quark-purple rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-white font-inter">
                      {userProfile?.full_name?.charAt(0) || user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-slate-600" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50">
                    <div className="px-4 py-3 border-b">
                      <p className="text-sm font-medium text-quark-grey font-inter">
                        {userProfile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                      </p>
                      <p className="text-xs text-slate-500 font-inter">{user?.email}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-inter">
                          {userProfile?.current_plan?.plan_name || 'Free'} Plan
                        </span>
                        <span className="text-xs text-slate-600 font-inter font-medium">
                          {userProfile?.credits?.available_credits?.toLocaleString() || '0'} credits
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false)
                        router.push('/platform/settings')
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center space-x-2 font-inter"
                    >
                      <User className="h-4 w-4" />
                      <span>Profile Settings</span>
                    </button>
                    <hr className="my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 font-inter"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-8 bg-slate-50">
          <div className="fade-in">
            {/* Phone Verification Banner */}
            <PhoneVerificationBanner />
            {children}
          </div>
        </main>
      </div>

      {/* Overlay for mobile */}
      {userDropdownOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-25 lg:hidden"
          onClick={() => setUserDropdownOpen(false)}
        />
      )}
    </div>
  )
}
