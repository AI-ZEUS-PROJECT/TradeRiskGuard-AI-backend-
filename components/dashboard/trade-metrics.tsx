import { BarChart3, DollarSign, TrendingUp, Clock } from "lucide-react"

type TradeMetricsProps = {
  analysis: any | null
}

export function TradeMetrics({ analysis }: TradeMetricsProps) {
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
  
  const tradeStats = [
    {
      label: "Total Trades",
      value: String(metrics.total_trades || 0),
      icon: BarChart3,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Net P&L",
      value: `$${(metrics.net_profit || 0).toFixed(2)}`,
      icon: DollarSign,
      color: (metrics.net_profit || 0) >= 0 ? "text-success" : "text-destructive",
      bgColor: (metrics.net_profit || 0) >= 0 ? "bg-success/10" : "bg-destructive/10",
    },
    {
      label: "Avg Win/Loss",
      value: `$${(metrics.avg_win || 0).toFixed(2)} / $${(metrics.avg_loss || 0).toFixed(2)}`,
      icon: TrendingUp,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      label: "Avg Duration",
      value: `${(metrics.avg_trade_duration_hours || 0).toFixed(1)}h`,
      icon: Clock,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {tradeStats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <div
            key={index}
            className="p-6 rounded-xl bg-card/50 border border-border/30 hover:border-primary/20 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
              <div className={`p-2.5 rounded-lg ${stat.bgColor}`}>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
          </div>
        )
      })}
    </div>
  )
}
