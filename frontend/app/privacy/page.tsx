import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | QuarkfinAI',
  description: 'QuarkfinAI Privacy Policy - How we protect and use your data'
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              <strong>Last updated:</strong> July 28, 2025
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Overview</h2>
            <p className="text-gray-700 mb-6">
              QuarkfinAI is committed to protecting your privacy. This Privacy Policy 
              explains how we collect, use, and safeguard your information when you use our risk assessment platform.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Information We Collect</h2>
            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Personal Information</h3>
            <ul className="list-disc pl-6 text-gray-700 mb-6">
              <li>Name and email address</li>
              <li>Phone number (for verification)</li>
              <li>Company information</li>
              <li>Account credentials</li>
            </ul>
            
            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Usage Data</h3>
            <ul className="list-disc pl-6 text-gray-700 mb-6">
              <li>Risk assessment requests and results</li>
              <li>Platform usage analytics</li>
              <li>Device and browser information</li>
              <li>IP address and location data</li>
            </ul>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">How We Use Your Information</h2>
            <ul className="list-disc pl-6 text-gray-700 mb-6">
              <li>Provide and improve our risk assessment services</li>
              <li>Process payments and manage subscriptions</li>
              <li>Send important notifications and updates</li>
              <li>Ensure platform security and prevent fraud</li>
              <li>Comply with legal obligations</li>
            </ul>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Data Security</h2>
            <p className="text-gray-700 mb-6">
              We implement industry-standard security measures including encryption, secure data transmission, 
              and access controls to protect your information. We use Supabase for secure data storage and 
              AWS infrastructure for reliable service delivery.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Contact Us</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">
                <strong>Email:</strong> privacy@quarkfinai.com<br/>
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
