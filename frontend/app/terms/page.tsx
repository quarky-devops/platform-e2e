import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | QuarkfinAI',
  description: 'QuarkfinAI Terms of Service - Legal terms and conditions'
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              <strong>Last updated:</strong> July 28, 2025
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Acceptance of Terms</h2>
            <p className="text-gray-700 mb-6">
              By accessing and using QuarkfinAI risk assessment platform, you accept and agree 
              to be bound by the terms and provision of this agreement.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Service Description</h2>
            <p className="text-gray-700 mb-6">
              QuarkfinAI provides AI-powered risk assessment services for businesses, including:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-6">
              <li>Website risk assessment and analysis</li>
              <li>Business risk prevention tools</li>
              <li>Fraud detection capabilities</li>
              <li>Compliance verification services</li>
            </ul>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">User Accounts</h2>
            <ul className="list-disc pl-6 text-gray-700 mb-6">
              <li>Provide accurate and complete information</li>
              <li>Verify your phone number for security</li>
              <li>Maintain the security of your account credentials</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Subscription and Billing</h2>
            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Plans and Credits</h3>
            <ul className="list-disc pl-6 text-gray-700 mb-6">
              <li>Free Plan: 500 credits per month</li>
              <li>Startup Plan: 5,000 credits for $49/month</li>
              <li>Pro Plan: 15,000 credits for $149/month</li>
              <li>Enterprise Plan: 50,000 credits for $499/month</li>
            </ul>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Contact Information</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">
                <strong>Email:</strong> legal@quarkfinai.com<br/>
                <strong>Address:</strong> QuarkfinAI, Inc.<br/>
                <strong>Last Updated:</strong> July 28, 2025
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
