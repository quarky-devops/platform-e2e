'use client'

import BusinessRiskLanding from '../../../components/BusinessRiskLanding'

export default function BusinessRiskPage() {
  const handleStartAssessment = () => {
    // This would typically navigate to the actual assessment form
    // For now, we'll show an alert
    alert('Starting new assessment...')
  }

  return <BusinessRiskLanding onStartAssessment={handleStartAssessment} />
}
