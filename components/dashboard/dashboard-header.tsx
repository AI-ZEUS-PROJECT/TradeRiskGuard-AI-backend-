import { Upload } from "lucide-react"

interface DashboardHeaderProps {
  onUploadClick?: () => void
}

export function DashboardHeader({ onUploadClick }: DashboardHeaderProps) {
  return (
    <div className="border-b border-border/10 bg-card/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Risk Dashboard</h1>
            <p className="text-muted-foreground">AI-powered analysis of your trading portfolio</p>
          </div>
          <button
            onClick={onUploadClick}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/30 rounded-lg hover:bg-primary/20 transition-all duration-300 text-sm font-medium"
          >
            <Upload className="w-4 h-4" />
            Upload New File
          </button>
        </div>
      </div>
    </div>
  )
}
