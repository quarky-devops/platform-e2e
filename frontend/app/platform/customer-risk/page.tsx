'use client'

import { Users, Clock, Wrench, Sparkles } from 'lucide-react'

export default function CustomerRiskPage() {
  return (
    <div className="max-w-4xl mx-auto text-center">
      <div className="bg-white rounded-xl card-shadow-lg p-12">
        {/* Icon */}
        <div className="w-24 h-24 bg-quark-light-blue rounded-full flex items-center justify-center mx-auto mb-6">
          <Users className="h-12 w-12 text-quark-blue" />
        </div>

        {/* Header */}
        <h1 className="text-3xl font-bold text-quark-grey mb-4">Customer Risk Prevention</h1>
        
        {/* Work in Progress Message */}
        <div className="mb-8">
          <div className="inline-flex items-center space-x-2 bg-orange-100 text-orange-800 px-4 py-2 rounded-full mb-4">
            <Wrench className="h-5 w-5" />
            <span className="font-medium">Work in Progress</span>
          </div>
          <p className="text-xl text-slate-600 mb-2">Great things take time</p>
          <p className="text-slate-500">
            We're crafting something amazing for customer risk prevention. 
            Our team is working hard to deliver the most advanced fraud detection system.
          </p>
        </div>

        {/* Coming Soon Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="p-6 border border-slate-200 rounded-lg">
            <Sparkles className="h-8 w-8 text-quark-blue mx-auto mb-3" />
            <h3 className="font-semibold text-quark-grey mb-2">AI-Powered Detection</h3>
            <p className="text-sm text-slate-600">Advanced machine learning algorithms to identify fraudulent behavior patterns</p>
          </div>
          
          <div className="p-6 border border-slate-200 rounded-lg">
            <Clock className="h-8 w-8 text-quark-blue mx-auto mb-3" />
            <h3 className="font-semibold text-quark-grey mb-2">Real-time Analysis</h3>
            <p className="text-sm text-slate-600">Instant risk assessment and decision making for every customer interaction</p>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-slate-600 mb-2">
            <span>Development Progress</span>
            <span>75%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div className="bg-quark-blue h-2 rounded-full" style={{ width: '75%' }}></div>
          </div>
        </div>

        {/* CTA */}
        <div className="space-y-4">
          <p className="text-slate-600">Want to be notified when this feature launches?</p>
          <button className="bg-quark-blue text-white px-6 py-3 rounded-lg font-semibold hover:bg-quark-purple transition-colors">
            Notify Me
          </button>
        </div>
      </div>
    </div>
  )
}
