import { TrendingDown, AlertTriangle, Target, Percent } from "lucide-react"

const metrics = [
  {
    label: "Max Drawdown",
    value: "12.5%",
    change: "-2.3%",
    icon: TrendingDown,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
  },
  {
    label: "Risk/Reward Ratio",
    value: "1:2.4",
    change: "+0.3",
    icon: Target,
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    label: "Win Rate",
    value: "62.5%",
    change: "+5.2%",
    icon: Percent,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    label: "Value at Risk",
    value: "$2,450",
    change: "-18.5%",
    icon: AlertTriangle,
    color: "text-secondary",
    bgColor: "bg-secondary/10",
  },
]

export function RiskMetrics() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {metrics.map((metric, index) => {
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
            <p className={`text-xs font-medium ${metric.change.startsWith("+") ? "text-success" : "text-destructive"}`}>
              {metric.change} from last month
            </p>
          </div>
        )
      })}
    </div>
  )
}
