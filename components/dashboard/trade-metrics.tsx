import { BarChart3, DollarSign, TrendingUp, Clock } from "lucide-react"

const tradeStats = [
  {
    label: "Total Trades",
    value: "127",
    icon: BarChart3,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    label: "Total P&L",
    value: "$8,750",
    icon: DollarSign,
    color: "text-success",
    bgColor: "bg-success/10",
  },
  {
    label: "Avg Trade Return",
    value: "2.45%",
    icon: TrendingUp,
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    label: "Avg Trade Duration",
    value: "3h 24m",
    icon: Clock,
    color: "text-secondary",
    bgColor: "bg-secondary/10",
  },
]

export function TradeMetrics() {
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
