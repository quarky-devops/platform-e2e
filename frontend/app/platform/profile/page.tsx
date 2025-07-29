'use client'

import { User, Wrench } from 'lucide-react'

export default function ProfilePage() {
  return (
    <div className="max-w-4xl mx-auto text-center">
      <div className="bg-white rounded-xl card-shadow-lg p-8">
        <div className="w-16 h-16 bg-quark-light-blue rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="h-8 w-8 text-quark-blue" />
        </div>
        
        <h1 className="text-2xl font-bold text-quark-grey mb-4">User Profile</h1>
        
        <div className="inline-flex items-center space-x-2 bg-orange-100 text-orange-800 px-3 py-1 rounded-full mb-3">
          <Wrench className="h-4 w-4" />
          <span className="text-sm font-medium">Work in Progress</span>
        </div>
        
        <p className="text-slate-600 mb-6">
          User profile management and account information coming soon. 
          Great things take time!
        </p>
        
        <button className="bg-quark-blue text-white px-6 py-2 rounded-lg hover:bg-quark-purple transition-colors">
          Notify Me
        </button>
      </div>
    </div>
  )
}
