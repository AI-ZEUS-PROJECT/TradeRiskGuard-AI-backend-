import { FileText, Calendar, BarChart3 } from "lucide-react"

export function ReportPreview() {
  return (
    <div className="sticky top-20">
      <div className="p-6 rounded-xl bg-card/50 border border-border/30">
        <h3 className="font-semibold text-foreground mb-6">Report Preview</h3>

        <div className="space-y-4">
          {/* Report Cover */}
          <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 border border-border/30 rounded-lg p-4 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 rounded-full mb-3">
                <FileText className="w-3 h-3 text-primary" />
                <span className="text-xs font-medium text-primary">PDF Report</span>
              </div>
              <h4 className="text-sm font-bold text-foreground">Trading Risk Analysis</h4>
              <p className="text-xs text-muted-foreground mt-1">Performance Report 2024</p>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-3 h-3" />
                <span>Generated Today</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <BarChart3 className="w-3 h-3" />
                <span>127 Trades Analyzed</span>
              </div>
            </div>
          </div>

          {/* Report Info */}
          <div className="pt-4 border-t border-border/20">
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Selected Sections</p>
                <p className="text-sm text-foreground font-medium">6 of 6</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Estimated Pages</p>
                <p className="text-sm text-foreground font-medium">12-15 pages</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase mb-1">File Size</p>
                <p className="text-sm text-foreground font-medium">~2.4 MB</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-border/20 space-y-3">
            <button className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-all duration-300">
              Generate Report
            </button>
            <button className="w-full px-4 py-2 border border-border hover:bg-card/50 text-foreground rounded-lg text-sm font-semibold transition-all duration-300">
              Preview PDF
            </button>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
        <p className="text-xs text-foreground leading-relaxed">
          Reports are generated on-demand and include all selected sections. Downloads are available immediately.
        </p>
      </div>
    </div>
  )
}
