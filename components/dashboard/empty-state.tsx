import { Upload, ArrowRight } from "lucide-react"
import Link from "next/link"

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-32 px-4">
      <div className="p-4 bg-primary/10 rounded-xl mb-6">
        <Upload className="w-8 h-8 text-primary" />
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-2">No Data Analyzed Yet</h2>
      <p className="text-muted-foreground text-center max-w-md mb-8">
        Upload your trading CSV file to get started with AI-powered risk analysis and insights.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-300 font-semibold"
      >
        Upload Trades
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  )
}
