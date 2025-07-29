'use client'

import { 
  TrendingUp, 
  Building2, 
  Shield, 
  AlertTriangle, 
  BarChart3,
  PieChart,
  Calendar,
  Users,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import { useBusinessRiskInsights, useBusinessRiskAssessments } from '../../hooks/useAPI'

export default function InsightsPage() {
  const { insights, loading: insightsLoading, error: insightsError, refetch: refetchInsights } = useBusinessRiskInsights()
  const { assessments, loading: assessmentsLoading, refreshAssessments } = useBusinessRiskAssessments()

  const handleRefresh = () => {
    refetchInsights()
    refreshAssessments()
  }

  // Calculate additional metrics from assessments data
  const completedAssessments = assessments.filter(a => a.status === 'Completed')
  const inProgressAssessments = assessments.filter(a => a.status === 'In Progress')
  const failedAssessments = assessments.filter(a => a.status === 'Failed')

  const riskDistribution = {
    low: assessments.filter(a => a.risk_level === 'Low').length,
    medium: assessments.filter(a => a.risk_level === 'Medium').length,
    high: assessments.filter(a => a.risk_level === 'High').length,
  }

  const loading = insightsLoading || assessmentsLoading

  if (insightsError) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-800 mb-2 font-inter">Failed to Load Insights</h2>
          <p className="text-red-600 mb-4 font-inter">{insightsError.message}</p>
          <button
            onClick={handleRefresh}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors font-inter"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-quark-grey mb-2 font-inter">Business Intelligence Dashboard</h1>
          <p className="text-slate-600 text-lg font-inter">
            Real-time insights and analytics from your fraud prevention assessments
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="bg-quark-blue text-white px-4 py-2 rounded-lg font-medium hover:bg-quark-purple transition-colors flex items-center space-x-2 disabled:opacity-50 font-inter"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <Building2 className="h-8 w-8 text-quark-blue" />
            <span className="text-sm text-green-600 font-medium font-inter">+12%</span>
          </div>
          <h3 className="text-2xl font-bold text-quark-grey mb-1 font-inter">
            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (insights?.total_assessments || 0)}
          </h3>
          <p className="text-slate-600 text-sm font-inter">Total Assessments</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="h-8 w-8 text-red-600" />
            <span className="text-sm text-red-600 font-medium font-inter">+8%</span>
          </div>
          <h3 className="text-2xl font-bold text-quark-grey mb-1 font-inter">
            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (insights?.high_risk_businesses || 0)}
          </h3>
          <p className="text-slate-600 text-sm font-inter">High Risk Detections</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="h-8 w-8 text-orange-600" />
            <span className="text-sm text-orange-600 font-medium font-inter">-2.1%</span>
          </div>
          <h3 className="text-2xl font-bold text-quark-grey mb-1 font-inter">
            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (insights?.average_risk_score?.toFixed(1) || '0.0')}
          </h3>
          <p className="text-slate-600 text-sm font-inter">Average Risk Score</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <Shield className="h-8 w-8 text-green-600" />
            <span className="text-sm text-green-600 font-medium font-inter">+15%</span>
          </div>
          <h3 className="text-2xl font-bold text-quark-grey mb-1 font-inter">
            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : completedAssessments.length}
          </h3>
          <p className="text-slate-600 text-sm font-inter">Completed This Month</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Risk Trends Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-quark-grey font-inter">Risk Score Trends</h3>
            <BarChart3 className="h-5 w-5 text-quark-blue" />
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-quark-blue" />
            </div>
          ) : insights?.risk_trends && insights.risk_trends.length > 0 ? (
            <div className="space-y-4">
              {insights.risk_trends.map((trend, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700 font-inter">{trend.month}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-slate-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          trend.score <= 40 ? 'bg-green-500' : 
                          trend.score <= 70 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(trend.score, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm text-slate-600 w-10 font-inter">{trend.score.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-slate-500">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-slate-300 mx-auto mb-2" />
                <p className="font-inter">No trend data available</p>
              </div>
            </div>
          )}
        </div>

        {/* Risk Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-quark-grey font-inter">Risk Level Distribution</h3>
            <PieChart className="h-5 w-5 text-quark-blue" />
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-quark-blue" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="font-medium text-green-800 font-inter">Low Risk</span>
                </div>
                <span className="text-green-700 font-semibold font-inter">{riskDistribution.low}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="font-medium text-yellow-800 font-inter">Medium Risk</span>
                </div>
                <span className="text-yellow-700 font-semibold font-inter">{riskDistribution.medium}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="font-medium text-red-800 font-inter">High Risk</span>
                </div>
                <span className="text-red-700 font-semibold font-inter">{riskDistribution.high}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Risk Categories Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Risk Categories */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-quark-grey font-inter">Top Risk Categories</h3>
            <AlertTriangle className="h-5 w-5 text-quark-blue" />
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-quark-blue" />
            </div>
          ) : insights?.top_risk_categories && insights.top_risk_categories.length > 0 ? (
            <div className="space-y-3">
              {insights.top_risk_categories.map((category, index) => (
                <div key={index} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg">
                  <div>
                    <span className="font-medium text-slate-700 font-inter">{category.category}</span>
                    <span className="text-sm text-slate-500 ml-2 font-inter">({category.percentage.toFixed(1)}%)</span>
                  </div>
                  <span className="bg-quark-blue text-white px-2 py-1 rounded text-sm font-medium font-inter">
                    {category.count}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-slate-500">
              <div className="text-center">
                <AlertTriangle className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-inter">No risk category data</p>
              </div>
            </div>
          )}
        </div>

        {/* Assessment Status */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-quark-grey font-inter">Assessment Status</h3>
            <Users className="h-5 w-5 text-quark-blue" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-medium text-green-800 font-inter">Completed</span>
              </div>
              <span className="text-green-700 font-semibold font-inter">{completedAssessments.length}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="font-medium text-blue-800 font-inter">In Progress</span>
              </div>
              <span className="text-blue-700 font-semibold font-inter">{inProgressAssessments.length}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="font-medium text-red-800 font-inter">Failed</span>
              </div>
              <span className="text-red-700 font-semibold font-inter">{failedAssessments.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-quark-grey mb-4 font-inter">Performance Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-quark-blue mb-1 font-inter">
              {assessments.length > 0 ? Math.round((completedAssessments.length / assessments.length) * 100) : 0}%
            </div>
            <div className="text-sm text-slate-600 font-inter">Success Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 mb-1 font-inter">
              {insights?.average_risk_score?.toFixed(1) || '0.0'}
            </div>
            <div className="text-sm text-slate-600 font-inter">Avg Risk Score</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-1 font-inter">
              {assessments.length > 0 ? Math.round((riskDistribution.low / assessments.length) * 100) : 0}%
            </div>
            <div className="text-sm text-slate-600 font-inter">Low Risk Rate</div>
          </div>
        </div>
      </div>
    </div>
  )
}
