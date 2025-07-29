import './globals.css'
import type { Metadata, Viewport } from 'next'
import { AuthProvider } from '../components/AuthProvider'
import AuthGuard from '../components/AuthGuard'

export const metadata: Metadata = {
  metadataBase: new URL('https://platform.quarkfinai.com'),
  title: 'QuarkfinAI Platform - Protect Commerce, Enable Growth',
  description: 'AI-powered fraud prevention platform helping D2C brands stop fraudulent customers, fake returns, chargebacks, and account takeovers before they cause damage.',
  keywords: 'D2C fraud prevention, AI fraud detection, ecommerce security, chargeback prevention, account takeover protection, business risk assessment',
  authors: [{ name: 'QuarkfinAI' }],
  creator: 'QuarkfinAI',
  publisher: 'QuarkfinAI',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' }
    ]
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://platform.quarkfinai.com',
    siteName: 'QuarkfinAI Platform',
    title: 'QuarkfinAI Platform - AI-Powered Fraud Prevention for D2C Brands',
    description: 'Protect your D2C business from fraud with advanced AI that detects suspicious customers, prevents fake returns, and stops chargebacks before they impact your growth.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'QuarkfinAI - Protect Commerce, Enable Growth'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'QuarkfinAI Platform - AI-Powered Fraud Prevention',
    description: 'Stop fraud before it hurts your D2C business. Advanced AI protection for growing brands.',
    images: ['/og-image.png']
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#3A50D9'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className="font-inter antialiased">
        <AuthProvider>
          <AuthGuard>
            {children}
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  )
}
