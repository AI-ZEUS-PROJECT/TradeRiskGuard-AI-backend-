import { TrendingDown, AlertTriangle, Target, Percent } from "lucide-react"

type RiskMetricsProps = {
  analysis: any | null
}

export function RiskMetrics({ analysis }: RiskMetricsProps) {
  if (!analysis) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="p-6 rounded-xl bg-card/50 border border-border/30 text-center text-muted-foreground">
          No analysis data available
        </div>
      </div>
    )
  }

  const metrics = analysis.metrics || {}
  const riskResults = analysis.risk_results || {}
  const scoreResult = analysis.score_result || {}

  const metricsData = [
    {
      label: "Max Drawdown",
      value: `${(metrics.max_drawdown_pct || 0).toFixed(1)}%`,
      icon: TrendingDown,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      label: "Risk/Reward Ratio",
      value: `1:${(metrics.avg_risk_reward_ratio || 0).toFixed(2)}`,
      icon: Target,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      label: "Win Rate",
      value: `${(metrics.win_rate || 0).toFixed(1)}%`,
      icon: Percent,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Risk Score",
      value: scoreResult.grade || "N/A",
      icon: AlertTriangle,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {metricsData.map((metric, index) => {
        const Icon = metric.icon
        return (
          <div
            key={index}
            className="p-6 rounded-xl bg-card/50 border border-border/30 hover:border-primary/20 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
              <div className={`p-2.5 rounded-lg ${metric.bgColor}`}>
                <Icon className={`w-4 h-4 ${metric.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground mb-2">{metric.value}</p>
          </div>
        )
      })}
    </div>
  )
}
