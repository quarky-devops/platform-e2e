'use client'

import { useState } from 'react'
import { Phone, X } from 'lucide-react'
import { useAuth } from './AuthProvider'

export default function PhoneVerificationBanner() {
  const { userProfile } = useAuth()
  const [showBanner, setShowBanner] = useState(true)

  // Don't show banner if user has verified phone or if manually dismissed
  if (!userProfile || userProfile.phone_verified || !showBanner) {
    return null
  }

  // Check if user needs to add/verify phone
  const needsPhoneSetup = !userProfile.phone || !userProfile.phone_verified

  // Don't show if phone is already set up and verified
  if (!needsPhoneSetup) {
    return null
  }

  const handleDismiss = () => {
    setShowBanner(false)
  }

  return (
    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-l-4 border-amber-400 p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Phone className="h-5 w-5 text-amber-600" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-amber-800 font-inter">
              📱 Phone Verification Required
            </p>
            <p className="text-sm text-amber-700 font-inter mt-1">
              Add and verify your phone number in Settings to access all platform features and create risk assessments.
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <a
            href="/platform/settings"
            className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors font-inter"
          >
            Go to Settings
          </a>
          <button
            onClick={handleDismiss}
            className="text-amber-600 hover:text-amber-800 p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
