"use client"

import { DashboardSummary } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  TrendingUp, 
  Target, 
  DollarSign, 
  Shield,
  Award,
  Loader2
} from "lucide-react"

interface DashboardSummaryCardProps {
  summary: DashboardSummary | null
  loading?: boolean
}

export function DashboardSummaryCard({ summary, loading }: DashboardSummaryCardProps) {
  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Trading Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (!summary) {
    return (
      <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Trading Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No trading data available yet. Upload your trades to see your overview.
          </p>
        </CardContent>
      </Card>
    )
  }

  const getGradeColor = (grade: string) => {
    switch (grade?.toUpperCase()) {
      case 'A': return 'text-green-500 bg-green-500/10'
      case 'B': return 'text-blue-500 bg-blue-500/10'
      case 'C': return 'text-yellow-500 bg-yellow-500/10'
      case 'D': return 'text-orange-500 bg-orange-500/10'
      case 'F': return 'text-red-500 bg-red-500/10'
      default: return 'text-muted-foreground bg-muted/50'
    }
  }

  const getRiskScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500'
    if (score >= 60) return 'text-blue-500'
    if (score >= 40) return 'text-yellow-500'
    return 'text-red-500'
  }

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Trading Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <Target className="w-3 h-3" />
              Total Trades
            </div>
            <p className="text-2xl font-bold text-foreground">{summary.total_trades ?? 0}</p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <TrendingUp className="w-3 h-3" />
              Win Rate
            </div>
            <p className="text-2xl font-bold text-foreground">
              {summary.win_rate != null ? `${summary.win_rate.toFixed(1)}%` : 'N/A'}
            </p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <DollarSign className="w-3 h-3" />
              Total Profit
            </div>
            <p className={`text-2xl font-bold ${(summary.total_profit ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {summary.total_profit != null ? `$${summary.total_profit.toFixed(2)}` : 'N/A'}
            </p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <Shield className="w-3 h-3" />
              Risk Score
            </div>
            <p className={`text-2xl font-bold ${getRiskScoreColor(summary.risk_score ?? 0)}`}>
              {summary.risk_score ?? 'N/A'}
            </p>
          </div>
        </div>
        
        {summary.grade && (
          <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Award className="w-4 h-4" />
              Overall Grade
            </span>
            <span className={`px-3 py-1 rounded-full text-lg font-bold ${getGradeColor(summary.grade)}`}>
              {summary.grade}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
