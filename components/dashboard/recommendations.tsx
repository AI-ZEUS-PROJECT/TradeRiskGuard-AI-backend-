import { Lightbulb } from "lucide-react"

type RecommendationsBoxProps = {
  analysis: any | null
}

export function RecommendationsBox({ analysis }: RecommendationsBoxProps) {
  if (!analysis) {
    return (
      <div className="p-6 rounded-xl bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20 mb-8">
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <Lightbulb className="w-6 h-6 text-primary mt-0.5" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-4">AI Recommendations</h3>
            <p className="text-muted-foreground text-sm">No recommendations available. Upload trade data to get AI insights.</p>
          </div>
        </div>
      </div>
    )
  }

  const scoreResult = analysis.score_result || {}
  const aiExplanations = analysis.ai_explanations || {}
  const recommendation = scoreResult.recommendation || aiExplanations.ai_recommendation || "Continue monitoring your trading performance."
  const keyRisks = aiExplanations.key_risks || []
  const actionableInsights = aiExplanations.actionable_insights || []

  // Combine recommendation with key risks and actionable insights
  const recommendations = [
    recommendation,
    ...keyRisks.map((risk: string) => `Address: ${risk}`),
    ...actionableInsights,
  ].filter(Boolean).slice(0, 5) // Limit to 5 recommendations

  return (
    <div className="p-6 rounded-xl bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20 mb-8">
      <div className="flex gap-4">
        <div className="flex-shrink-0">
          <Lightbulb className="w-6 h-6 text-primary mt-0.5" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground mb-4">AI Recommendations</h3>
          {recommendations.length > 0 ? (
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
          ) : (
            <p className="text-muted-foreground text-sm">No specific recommendations at this time.</p>
          )}
        </div>
      </div>
    </div>
  )
}
