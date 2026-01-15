"use client"

type Props = {
  selectedSections: string[]
  onToggle: (id: string) => void
  format: string
  onFormatChange: (format: string) => void
}

const sections = [
  {
    id: "summary",
    title: "Executive Summary",
    description: "High-level overview of trading performance and key metrics",
    included: true,
  },
  {
    id: "analysis",
    title: "Trade Analysis",
    description: "Detailed breakdown of each trade with entry/exit analysis",
    included: true,
  },
  {
    id: "metrics",
    title: "Performance Metrics",
    description: "Win rate, ROI, Sharpe ratio, and other key indicators",
    included: true,
  },
  {
    id: "risk",
    title: "Risk Analysis",
    description: "Maximum drawdown, value at risk, and portfolio concentration",
    included: true,
  },
  {
    id: "insights",
    title: "AI Insights",
    description: "Machine learning analysis of trading patterns and behaviors",
    included: true,
  },
  {
    id: "recommendations",
    title: "Action Plan",
    description: "Specific recommendations to improve future trading performance",
    included: true,
  },
]

export function ReportSections({ selectedSections, onToggle, format, onFormatChange }: Props) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-6">Report Sections</h2>
      <div className="space-y-4">
        {sections.map((section) => (
          <div
            key={section.id}
            className="p-4 rounded-lg border border-border/30 bg-card/30 hover:border-primary/20 transition-all duration-300 cursor-pointer"
            onClick={() => onToggle(section.id)}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={selectedSections.includes(section.id)}
                  onChange={() => onToggle(section.id)}
                  className="w-5 h-5 rounded border-border bg-card cursor-pointer accent-primary"
                />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">{section.title}</h3>
                <p className="text-sm text-muted-foreground">{section.description}</p>
              </div>
              {section.included && (
                <div className="flex-shrink-0 px-3 py-1 bg-primary/10 rounded-full text-xs font-medium text-primary">
                  Included
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-6 bg-card/50 border border-border/30 rounded-lg">
        <h3 className="font-semibold text-foreground mb-4">Report Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Report Format</label>
            <select
              value={format}
              onChange={(e) => onFormatChange(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="pdf">PDF (Recommended)</option>
              <option value="markdown">Markdown</option>
              <option value="html">HTML</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Report Period</label>
            <select className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
              <option>Last 30 Days</option>
              <option>Last 90 Days</option>
              <option>Year to Date</option>
              <option>All Time</option>
            </select>
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-border bg-card accent-primary" />
              <span className="text-sm text-foreground">Include charts and visualizations</span>
            </label>
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-border bg-card accent-primary" />
              <span className="text-sm text-foreground">Include detailed trade-by-trade breakdown</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}
