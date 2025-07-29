'use client'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  className?: string
}

export function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8', 
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  }

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl', 
    xl: 'text-4xl'
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* QuarkfinAI Shield Logo with Q */}
      <div className={`${sizeClasses[size]} relative`}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Shield background with gradient */}
          <defs>
            <linearGradient id="quark-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3A50D9" />
              <stop offset="100%" stopColor="#2C2F8F" />
            </linearGradient>
          </defs>
          
          {/* Shield shape */}
          <path 
            d="M50 10 L20 25 L20 65 Q20 75 30 80 L50 90 L70 80 Q80 75 80 65 L80 25 Z" 
            fill="url(#quark-gradient)" 
            stroke="none"
          />
          
          {/* Stylized Q made of connected dots/nodes */}
          <g fill="white">
            {/* Q outer ring - represented as connected dots */}
            <circle cx="35" cy="35" r="2.5" />
            <circle cx="45" cy="30" r="2.5" />
            <circle cx="55" cy="30" r="2.5" />
            <circle cx="65" cy="35" r="2.5" />
            <circle cx="70" cy="45" r="2.5" />
            <circle cx="70" cy="55" r="2.5" />
            <circle cx="65" cy="65" r="2.5" />
            <circle cx="55" cy="70" r="2.5" />
            <circle cx="45" cy="70" r="2.5" />
            <circle cx="35" cy="65" r="2.5" />
            <circle cx="30" cy="55" r="2.5" />
            <circle cx="30" cy="45" r="2.5" />
            
            {/* Q tail - diagonal connection */}
            <circle cx="60" cy="60" r="2.5" />
            <circle cx="68" cy="68" r="2.5" />
            
            {/* Connection lines between dots (representing AI network) */}
            <g stroke="white" strokeWidth="1" opacity="0.6" fill="none">
              <path d="M35,35 L45,30" />
              <path d="M45,30 L55,30" />
              <path d="M55,30 L65,35" />
              <path d="M65,35 L70,45" />
              <path d="M70,45 L70,55" />
              <path d="M70,55 L65,65" />
              <path d="M65,65 L55,70" />
              <path d="M55,70 L45,70" />
              <path d="M45,70 L35,65" />
              <path d="M35,65 L30,55" />
              <path d="M30,55 L30,45" />
              <path d="M30,45 L35,35" />
              <path d="M60,60 L68,68" />
              <path d="M65,65 L60,60" />
            </g>
          </g>
        </svg>
      </div>
      
      {showText && (
        <span className={`font-bold text-quark-grey ${textSizeClasses[size]} font-inter`}>
          QuarkfinAI
        </span>
      )}
    </div>
  )
}

export function AppIcon({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  return <Logo size={size} showText={false} className={className} />
}
