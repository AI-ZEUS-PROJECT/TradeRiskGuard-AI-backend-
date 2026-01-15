import { FileText, Calendar, BarChart3, Eye } from "lucide-react"
import { useState, useMemo } from "react"

type Props = {
  selectedCount: number
  isGenerating: boolean
  onGenerate: () => void
  onDownloadLatest?: () => void
  latestReportMeta?: {
    generatedAt?: string
    format?: string
    tradeCount?: number
  }
  reportContent?: string | null
  analysis?: any | null
  loadingPreview?: boolean
}

// Parse markdown content into structured sections
function parseMarkdownToSections(content: string) {
  // Try to parse as JSON first (API response)
  let markdown = content
  try {
    const parsed = JSON.parse(content)
    if (parsed.content) {
      markdown = parsed.content
    }
  } catch {
    // Not JSON, use as-is
  }

  // Extract sections from markdown
  const sections: { title: string; content: string; icon: string }[] = []
  
  // Split by headers
  const lines = markdown.split('\n')
  let currentSection = { title: '', content: '', icon: '📊' }
  
  const iconMap: { [key: string]: string } = {
    'executive summary': '🎯',
    'trading performance': '📈',
    'risk analysis': '🚨',
    'ai insights': '🎓',
    'action plan': '📋',
    'disclaimers': '⚠️',
    'summary': '🎯',
    'metrics': '📈',
    'risk': '🚨',
    'insights': '🎓',
    'plan': '📋',
  }
  
  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (currentSection.title) {
        sections.push({ ...currentSection })
      }
      const rawTitle = line.replace(/^##\s*/, '').replace(/[🎯📈🚨🎓📋⚠️📊]/g, '').trim()
      const titleLower = rawTitle.toLowerCase()
      let icon = '📊'
      for (const [key, value] of Object.entries(iconMap)) {
        if (titleLower.includes(key)) {
          icon = value
          break
        }
      }
      currentSection = { title: rawTitle, content: '', icon }
    } else if (currentSection.title) {
      currentSection.content += line + '\n'
    }
  }
  
  if (currentSection.title) {
    sections.push(currentSection)
  }
  
  return sections
}

export function ReportPreview({ 
  selectedCount, 
  isGenerating, 
  onGenerate, 
  onDownloadLatest, 
  latestReportMeta,
  reportContent,
  analysis,
  loadingPreview 
}: Props) {
  const [showPreview, setShowPreview] = useState(false)
  const tradeCount = analysis?.trade_count || analysis?.metrics?.total_trades || 0

  // Parse report sections for structured preview
  const reportSections = useMemo(() => {
    if (!reportContent) return []
    return parseMarkdownToSections(reportContent)
  }, [reportContent])

  return (
    <div className="sticky top-20 space-y-4">
      <div className="p-6 rounded-xl bg-card/50 border border-border/30">
        <h3 className="font-semibold text-foreground mb-6">Report Preview</h3>

        <div className="space-y-4">
          {/* Report Cover */}
          <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 border border-border/30 rounded-lg p-4 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 rounded-full mb-3">
                <FileText className="w-3 h-3 text-primary" />
                <span className="text-xs font-medium text-primary">
                  {latestReportMeta?.format?.toUpperCase() || "Report"}
                </span>
              </div>
              <h4 className="text-sm font-bold text-foreground">Trading Risk Analysis</h4>
              <p className="text-xs text-muted-foreground mt-1">
                {analysis?.original_filename || analysis?.filename || "Performance Report 2026"}
              </p>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-3 h-3" />
                <span>{latestReportMeta?.generatedAt ? new Date(latestReportMeta.generatedAt).toLocaleDateString() : (analysis?.created_at ? new Date(analysis.created_at).toLocaleDateString() : "Ready to generate")}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <BarChart3 className="w-3 h-3" />
                <span>{tradeCount > 0 ? `${tradeCount} Trades Analyzed` : "Trades analyzed after generation"}</span>
              </div>
            </div>
          </div>

          {/* Report Info */}
          <div className="pt-4 border-t border-border/20">
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Selected Sections</p>
                <p className="text-sm text-foreground font-medium">{selectedCount} selected</p>
              </div>
              {analysis && (
                <>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Risk Score</p>
                    <p className="text-sm text-foreground font-medium">
                      {analysis.score_result?.grade || "N/A"} ({analysis.score_result?.score || 0}/100)
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Risk Level</p>
                    <p className="text-sm text-foreground font-medium">
                      {analysis.risk_results?.total_risks || 0} risks detected
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-border/20 space-y-3">
            <button 
              onClick={onGenerate}
              disabled={isGenerating}
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? "Generating..." : "Generate Report"}
            </button>
            {onDownloadLatest && (
              <button
                onClick={onDownloadLatest}
                className="w-full px-4 py-2 border border-border hover:bg-card/50 text-foreground rounded-lg text-sm font-semibold transition-all duration-300"
              >
                Download Latest
              </button>
            )}
            {reportContent && (
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="w-full px-4 py-2 border border-primary/50 hover:bg-primary/10 text-primary rounded-lg text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" />
                {showPreview ? "Hide Preview" : "Show Preview"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Report Content Preview */}
      {showPreview && reportContent && (
        <div className="p-6 rounded-xl bg-card/50 border border-border/30 max-h-[600px] overflow-auto">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-foreground">Report Content Preview</h4>
            <span className="text-xs text-muted-foreground bg-muted/20 px-2 py-1 rounded">
              {reportSections.length} sections
            </span>
          </div>
          {loadingPreview ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-4 isolate">
              {reportSections.length > 0 ? (
                reportSections.map((section, index) => (
                  <div key={index} className="p-4 rounded-lg bg-muted/10 border border-border/20">
                    <h5 className="font-medium text-foreground mb-2 flex items-center gap-2">
                      <span className="text-lg">{section.icon}</span>
                      <span className="text-sm">{section.title}</span>
                    </h5>
                    <div className="text-sm text-muted-foreground leading-relaxed">
                      {section.content
                        .split('\n')
                        .filter(line => line.trim())
                        .slice(0, 5)
                        .map((line, i) => (
                          <p key={i} className="mb-1">
                            {line.replace(/^\*\*(.+?)\*\*/, '$1').replace(/^\|.*\|$/, '(table data)').replace(/^-+$/, '')}
                          </p>
                        ))}
                      {section.content.split('\n').filter(l => l.trim()).length > 5 && (
                        <p className="text-primary text-xs mt-2">... more in full report</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-lg bg-muted/10 border border-border/20">
                  <p className="text-sm text-muted-foreground">Report content available after generation</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Info Box */}
      <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
        <p className="text-xs text-foreground leading-relaxed">
          Reports are generated on-demand and include all selected sections. Downloads are available immediately.
        </p>
      </div>
    </div>
  )
}
