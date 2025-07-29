'use client'

import { useState, useEffect } from 'react'
import { Coins, Plus, AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from './AuthProvider'

interface CreditBalanceProps {
  className?: string
}

export default function CreditBalance({ className = '' }: CreditBalanceProps) {
  const { userProfile, refreshUserProfile } = useAuth()
  const [refreshing, setRefreshing] = useState(false)

  const credits = userProfile?.credits

  const handleRefresh = async () => {
    setRefreshing(true)
    await refreshUserProfile()
    setRefreshing(false)
  }

  const getCreditColor = () => {
    if (!credits) return 'text-slate-500'
    
    const percentage = (credits.available_credits / credits.total_credits) * 100
    if (percentage > 50) return 'text-green-600'
    if (percentage > 20) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getCreditStatus = () => {
    if (!credits) return 'Loading...'
    
    const percentage = (credits.available_credits / credits.total_credits) * 100
    if (percentage > 50) return 'Good'
    if (percentage > 20) return 'Low'
    return 'Critical'
  }

  if (!userProfile) {
    return null
  }

  return (
    <div className={`bg-white rounded-lg border border-slate-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-quark-blue bg-opacity-10 rounded-lg flex items-center justify-center">
            <Coins className="h-4 w-4 text-quark-blue" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800 font-inter">Credits</h3>
            <p className="text-xs text-slate-500 font-inter">{getCreditStatus()}</p>
          </div>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-1 hover:bg-slate-100 rounded transition-colors"
          title="Refresh balance"
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 text-slate-400 animate-spin" />
          ) : (
            <AlertCircle className="h-4 w-4 text-slate-400" />
          )}
        </button>
      </div>

      {credits ? (
        <div className="space-y-3">
          {/* Available Credits */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600 font-inter">Available</span>
            <span className={`text-lg font-bold ${getCreditColor()} font-inter`}>
              {credits.available_credits.toLocaleString()}
            </span>
          </div>

          {/* Credit Breakdown */}
          <div className="space-y-1 text-xs text-slate-500 font-inter">
            <div className="flex justify-between">
              <span>Subscription:</span>
              <span>{credits.subscription_credits.toLocaleString()}</span>
            </div>
            {credits.recharged_credits > 0 && (
              <div className="flex justify-between">
                <span>Purchased:</span>
                <span>{credits.recharged_credits.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-200 pt-1">
              <span>Used:</span>
              <span>{credits.used_credits.toLocaleString()}</span>
            </div>
          </div>

          {/* Low Credit Warning */}
          {credits.available_credits < 50 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-xs text-yellow-700 font-inter">
                  {credits.available_credits < 10 ? 'Critical: ' : 'Low credits: '}
                  Consider upgrading your plan
                </span>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex space-x-2">
            <button
              onClick={() => window.open('/pricing', '_blank')}
              className="flex-1 bg-quark-blue text-white text-xs py-2 px-3 rounded-lg hover:bg-quark-purple transition-colors font-inter flex items-center justify-center space-x-1"
            >
              <Plus className="h-3 w-3" />
              <span>Buy Credits</span>
            </button>
            <button
              onClick={() => window.open('/dashboard/usage', '_blank')}
              className="flex-1 bg-slate-100 text-slate-700 text-xs py-2 px-3 rounded-lg hover:bg-slate-200 transition-colors font-inter"
            >
              Usage
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-4">
          <Loader2 className="h-6 w-6 text-slate-400 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-inter">Loading credit balance...</p>
        </div>
      )}

      {/* Plan Info */}
      {userProfile.current_plan && (
        <div className="mt-3 pt-3 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-inter">Plan:</span>
            <span className="text-xs font-medium text-slate-700 font-inter">
              {userProfile.current_plan.plan_name}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-slate-500 font-inter">Monthly:</span>
            <span className="text-xs text-slate-700 font-inter">
              {userProfile.current_plan.monthly_credits.toLocaleString()} credits
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
