import { Lightbulb } from "lucide-react"

const recommendations = [
  "Consider reducing EUR/USD exposure - currently at 35% of portfolio",
  "Your drawdown peaked at 12.5% in June. Implement tighter stop losses to limit future drawdowns.",
  "Win rate is strong at 62.5%. Continue with current entry strategies.",
  "Risk/Reward ratio of 1:2.4 is healthy. Maintain current position sizing methodology.",
]

export function RecommendationsBox() {
  return (
    <div className="p-6 rounded-xl bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20 mb-8">
      <div className="flex gap-4">
        <div className="flex-shrink-0">
          <Lightbulb className="w-6 h-6 text-primary mt-0.5" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground mb-4">AI Recommendations</h3>
          <ul className="space-y-3">
            {recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/20 text-primary text-xs font-semibold flex-shrink-0 mt-0.5">
                  {index + 1}
                </span>
                <span className="text-foreground text-sm">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
