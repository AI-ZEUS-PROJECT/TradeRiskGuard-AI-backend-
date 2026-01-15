"use client"

import { DashboardInsight } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Lightbulb,
  Loader2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Info,
  Zap
} from "lucide-react"

interface DashboardInsightsCardProps {
  insights: DashboardInsight[]
  loading?: boolean
}

export function DashboardInsightsCard({ insights, loading }: DashboardInsightsCardProps) {
  const getInsightIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'positive':
      case 'strength':
      case 'success':
        return <TrendingUp className="w-4 h-4 text-green-500" />
      case 'negative':
      case 'risk':
      case 'warning':
        return <TrendingDown className="w-4 h-4 text-red-500" />
      case 'alert':
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />
      case 'achievement':
      case 'milestone':
        return <CheckCircle2 className="w-4 h-4 text-blue-500" />
      case 'tip':
      case 'suggestion':
        return <Zap className="w-4 h-4 text-purple-500" />
      default:
        return <Info className="w-4 h-4 text-muted-foreground" />
    }
  }

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-500/10 text-green-600'
    if (confidence >= 60) return 'bg-blue-500/10 text-blue-600'
    if (confidence >= 40) return 'bg-yellow-500/10 text-yellow-600'
    return 'bg-muted text-muted-foreground'
  }

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-amber-500/5 to-orange-500/5 border-amber-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (!insights || insights.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-amber-500/5 to-orange-500/5 border-amber-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No insights available yet. Complete more trades to receive personalized AI insights.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-br from-amber-500/5 to-orange-500/5 border-amber-500/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-500" />
          AI Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {(Array.isArray(insights) ? insights : []).slice(0, 5).map((insight, idx) => (
          <div 
            key={insight.id || idx} 
            className="p-3 rounded-lg bg-background/50 border border-border/50 hover:border-primary/30 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {getInsightIcon(insight.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4 className="text-sm font-medium text-foreground truncate">
                    {insight.title}
                  </h4>
                  {insight.confidence != null && (
                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${getConfidenceBadge(insight.confidence)}`}>
                      {insight.confidence}%
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {insight.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
