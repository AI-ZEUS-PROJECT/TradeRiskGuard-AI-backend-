import { TrendingUp, Shield, BarChart3, AlertCircle, Download, Zap } from "lucide-react"

const features = [
  {
    icon: TrendingUp,
    title: "Trade Analysis",
    description: "AI-powered analysis of your trading patterns, entry/exit points, and win rates.",
  },
  {
    icon: Shield,
    title: "Risk Assessment",
    description: "Comprehensive risk evaluation including position sizing and portfolio concentration.",
  },
  {
    icon: BarChart3,
    title: "Performance Metrics",
    description: "Detailed metrics on profitability, ROI, drawdowns, and other key indicators.",
  },
  {
    icon: AlertCircle,
    title: "Risk Alerts",
    description: "Real-time identification of high-risk trades and exposure levels.",
  },
  {
    icon: Download,
    title: "PDF Reports",
    description: "Generate professional reports with actionable recommendations.",
  },
  {
    icon: Zap,
    title: "Instant Processing",
    description: "Fast AI analysis of your trade data in seconds.",
  },
]

export function FeaturesSection() {
  return (
    <section className="py-20 sm:py-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Powerful Features</h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Everything you need to understand and optimize your trading risk
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => {
          const Icon = feature.icon
          return (
            <div
              key={index}
              className="group p-6 rounded-xl border border-border/50 bg-card/30 hover:bg-card/60 hover:border-primary/30 transition-all duration-300 cursor-pointer"
            >
              <div className="p-3 inline-flex items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-all duration-300 mb-4">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">{feature.description}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
