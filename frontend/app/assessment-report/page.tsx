import { Suspense } from 'react'
import AssessmentReport from '../../components/AssessmentReport'

export default function AssessmentReportPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-quark-blue mx-auto mb-4"></div>
          <p className="text-slate-600 font-inter">Loading assessment report...</p>
        </div>
      </div>
    }>
      <AssessmentReport />
    </Suspense>
  )
}