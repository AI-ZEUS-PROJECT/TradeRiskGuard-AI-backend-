"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { ReportHeader } from "@/components/report/report-header"
import { ReportSections } from "@/components/report/report-sections"
import { ReportPreview } from "@/components/report/report-preview"
import { useAuth } from "@/contexts/auth-context"
import { apiClient, ReportFormat } from "@/lib/api"

export default function ReportPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, isLoading } = useAuth()

  const [selectedSections, setSelectedSections] = useState<string[]>([
    "summary",
    "analysis",
    "metrics",
    "risk",
    "insights",
    "recommendations",
  ])
  const [format, setFormat] = useState<ReportFormat>("pdf")
  const [analysisId, setAnalysisId] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [latestReportId, setLatestReportId] = useState<string | null>(null)
  const [latestReportMeta, setLatestReportMeta] = useState<{ generatedAt?: string; format?: string; tradeCount?: number } | undefined>()
  const [reportContent, setReportContent] = useState<string | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [analysis, setAnalysis] = useState<any | null>(null)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/signin")
    }
  }, [isAuthenticated, isLoading, router])

  // Load analysis from URL param or fallback to latest
  useEffect(() => {
    if (!isAuthenticated || isLoading) return

    const urlAnalysisId = searchParams.get("analysisId")

    const load = async () => {
      setError(null)
      try {
        let targetAnalysisId = urlAnalysisId

        // If no analysisId in URL, get the latest
        if (!targetAnalysisId) {
          const listRes = await apiClient.listAnalyses({ limit: 1 })
          if (listRes.success && listRes.data && listRes.data.analyses.length > 0) {
            targetAnalysisId = listRes.data.analyses[0].id
          }
        }

        if (targetAnalysisId) {
          setAnalysisId(targetAnalysisId)

          // Load full analysis for preview
          const analysisRes = await apiClient.getAnalysis(targetAnalysisId)
          if (analysisRes.success && analysisRes.data) {
            setAnalysis(analysisRes.data)
          } else {
            setError(analysisRes.error || analysisRes.message || "Failed to load analysis.")
            setAnalysis(null)
          }

          // Load reports for that analysis
          const reportsRes = await apiClient.listReports(targetAnalysisId)
          if (reportsRes.success && Array.isArray(reportsRes.data) && reportsRes.data.length > 0) {
            const newest = reportsRes.data[0]
            setLatestReportId(newest.id)
            setLatestReportMeta({
              generatedAt: newest.generated_at,
              format: newest.report_type,
            })
            
            // Load report preview content
            await loadReportPreview(newest.id, newest.report_type)
          } else {
            setLatestReportId(null)
            setLatestReportMeta(undefined)
            setReportContent(null)
          }
        } else {
          setAnalysisId(null)
          setAnalysis(null)
        }
      } catch (e) {
        setError("Failed to load analysis or reports. Please try again.")
      }
    }

    load()
  }, [isAuthenticated, isLoading, searchParams])

  const toggleSection = (id: string) => {
    setSelectedSections((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]))
  }

  const loadReportPreview = async (reportId: string, reportType: string) => {
    setLoadingPreview(true)
    try {
      const blob = await apiClient.downloadReport(reportId, reportType as ReportFormat)
      if (blob) {
        const text = await blob.text()
        setReportContent(text)
      }
    } catch (e) {
      console.error("Failed to load report preview:", e)
    } finally {
      setLoadingPreview(false)
    }
  }

  const handleGenerate = async () => {
    if (!analysisId) {
      setError("No analysis available. Please analyze trades first.")
      return
    }
    setError(null)
    setIsGenerating(true)

    try {
      const res = await apiClient.generateReport({
        analysis_id: analysisId,
        format,
        include_sections: selectedSections,
      })

      if (!res.success || !res.data) {
        setError(res.error || res.message || "Failed to generate report.")
        return
      }

      // After generation, refresh list
      const reportsRes = await apiClient.listReports(analysisId)
      if (reportsRes.success && Array.isArray(reportsRes.data) && reportsRes.data.length > 0) {
        const newest = reportsRes.data[0]
        setLatestReportId(newest.id)
        setLatestReportMeta({
          generatedAt: newest.generated_at,
          format: newest.report_type,
        })
        
        // Load preview of new report
        await loadReportPreview(newest.id, newest.report_type)
      }
    } catch (e) {
      setError("Something went wrong while generating the report.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownloadLatest = async () => {
    if (!latestReportId) {
      setError("No report available to download yet.")
      return
    }
    setError(null)
    const blob = await apiClient.downloadReport(latestReportId, format)
    if (!blob) {
      setError("Failed to download the report.")
      return
    }

    // Process the blob content to extract actual report content
    const text = await blob.text()
    let processedContent = text
    
    try {
      const parsed = JSON.parse(text)
      if (parsed.content) {
        processedContent = parsed.content
      }
    } catch {
      // Not JSON, use as-is
    }

    // Create a proper file based on format
    let finalBlob: Blob
    let extension: string

    if (format === "html") {
      // Wrap markdown in HTML with styling
      const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TradeGuard AI - Risk Report</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6; 
      color: #1f2937; 
      max-width: 900px; 
      margin: 0 auto; 
      padding: 40px 20px;
      background: #f9fafb;
    }
    h1 { font-size: 2rem; color: #111827; margin-bottom: 1rem; border-bottom: 3px solid #6366f1; padding-bottom: 0.5rem; }
    h2 { font-size: 1.5rem; color: #374151; margin-top: 2rem; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; }
    h3 { font-size: 1.125rem; color: #4b5563; margin-top: 1.5rem; margin-bottom: 0.5rem; }
    p { margin-bottom: 1rem; color: #4b5563; }
    ul, ol { margin-left: 1.5rem; margin-bottom: 1rem; }
    li { margin-bottom: 0.5rem; color: #4b5563; }
    strong { color: #111827; }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background: #f3f4f6; font-weight: 600; color: #374151; }
    tr:hover { background: #f9fafb; }
    hr { border: none; border-top: 1px solid #e5e7eb; margin: 2rem 0; }
    .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 2rem; border-radius: 12px; margin-bottom: 2rem; }
    .header h1 { color: white; border-bottom-color: rgba(255,255,255,0.3); }
    .section { background: white; padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 1rem; border-radius: 4px; margin: 1rem 0; }
    @media print { body { background: white; } .section { box-shadow: none; border: 1px solid #e5e7eb; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 TradeGuard AI - Risk Report</h1>
    <p>Generated: ${new Date().toLocaleString()}</p>
  </div>
  ${processedContent
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '</div><div class="section"><h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^\*\*(.+?)\*\*$/gm, '<p><strong>$1</strong></p>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^---$/gm, '<hr>')
    .replace(/\|(.+)\|/g, (match) => {
      const cells = match.split('|').filter(c => c.trim()).map(c => `<td>${c.trim()}</td>`).join('')
      return `<tr>${cells}</tr>`
    })
  }
  </div>
</body>
</html>`
      finalBlob = new Blob([htmlContent], { type: 'text/html' })
      extension = 'html'
    } else if (format === "markdown") {
      finalBlob = new Blob([processedContent], { type: 'text/markdown' })
      extension = 'md'
      
      const url = window.URL.createObjectURL(finalBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = `tradeguard-report-${new Date().toISOString().split('T')[0]}.${extension}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      return
    } else {
      // PDF generation - open HTML in new window for print to PDF
      const pdfHtmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>TradeGuard AI - Risk Report</title>
  <style>
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: Arial, Helvetica, sans-serif;
      line-height: 1.6; 
      color: #1f2937; 
      padding: 40px;
      font-size: 12px;
      background-color: #ffffff;
    }
    h1 { font-size: 24px; color: #111827; margin-bottom: 12px; border-bottom: 3px solid #6366f1; padding-bottom: 8px; }
    h2 { font-size: 18px; color: #374151; margin-top: 24px; margin-bottom: 12px; }
    h3 { font-size: 14px; color: #4b5563; margin-top: 16px; margin-bottom: 8px; }
    p { margin-bottom: 12px; color: #4b5563; }
    ul, ol { margin-left: 20px; margin-bottom: 12px; }
    li { margin-bottom: 6px; color: #4b5563; }
    strong { color: #111827; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 11px; }
    th, td { padding: 8px 12px; text-align: left; border: 1px solid #e5e7eb; }
    th { background-color: #f3f4f6; font-weight: 600; color: #374151; }
    hr { border: none; border-top: 1px solid #e5e7eb; margin: 20px 0; }
    .header { background-color: #6366f1; color: #ffffff; padding: 24px; margin: -40px -40px 24px -40px; }
    .header h1 { color: #ffffff; border-bottom-color: rgba(255,255,255,0.3); }
    .header p { color: rgba(255,255,255,0.9); font-size: 12px; margin: 8px 0 0 0; }
    .section { padding: 16px 0; }
    .print-instructions { background: #fef3c7; padding: 16px; margin-bottom: 24px; border-radius: 8px; border: 1px solid #f59e0b; }
    .print-instructions p { color: #92400e; margin: 0; }
    @media print { .print-instructions { display: none; } }
  </style>
</head>
<body>
  <div class="print-instructions">
    <p><strong>To save as PDF:</strong> Press Ctrl+P (or Cmd+P on Mac), then select "Save as PDF" as the destination.</p>
  </div>
  <div class="header">
    <h1>📊 TradeGuard AI - Risk Report</h1>
    <p>Generated: ${new Date().toLocaleString()}</p>
  </div>
  <div class="content">
  ${processedContent
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<div class="section"><h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^\*\*(.+?)\*\*$/gm, '<p><strong>$1</strong></p>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)+/g, '<ul>$&</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^---$/gm, '</div><hr><div class="section">')
    .replace(/\|(.+)\|/g, (match: string) => {
      const cells = match.split('|').filter((c: string) => c.trim()).map((c: string) => `<td>${c.trim()}</td>`).join('')
      return `<tr>${cells}</tr>`
    })
  }
  </div>
</body>
</html>`

      // Open in new window for printing
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(pdfHtmlContent)
        printWindow.document.close()
        // Auto-trigger print dialog after content loads
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print()
          }, 250)
        }
      }
      return
    }

    const url = window.URL.createObjectURL(finalBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `tradeguard-report-${new Date().toISOString().split('T')[0]}.${extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <main className="flex flex-col min-h-screen bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <Footer />
      </main>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <main className="flex flex-col min-h-screen bg-background">
      <Header />
      <div className="flex-1">
        <ReportHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <ReportSections
                selectedSections={selectedSections}
                onToggle={toggleSection}
                format={format}
                onFormatChange={(f) => setFormat(f as ReportFormat)}
              />
            </div>
            <div>
              <ReportPreview
                selectedCount={selectedSections.length}
                isGenerating={isGenerating}
                onGenerate={handleGenerate}
                onDownloadLatest={latestReportId ? handleDownloadLatest : undefined}
                latestReportMeta={latestReportMeta}
                reportContent={reportContent}
                analysis={analysis}
                loadingPreview={loadingPreview}
              />
            </div>
          </div>

          {/* Back to Dashboard Section */}
          {analysisId && (
            <div className="mt-8 p-6 rounded-xl bg-gradient-to-r from-accent/5 via-primary/5 to-accent/5 border border-accent/20">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-xl font-bold text-foreground mb-2">Want to Review Your Analysis?</h3>
                  <p className="text-muted-foreground text-sm max-w-xl">
                    Go back to your dashboard to view detailed metrics, charts, AI insights, 
                    and recommendations for your trading performance analysis.
                  </p>
                  <div className="flex flex-wrap gap-3 mt-3 justify-center md:justify-start">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-accent/10 rounded-full text-xs text-accent">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                      Performance Charts
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-accent/10 rounded-full text-xs text-accent">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                      Risk Metrics
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-accent/10 rounded-full text-xs text-accent">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                      Trade Summary
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-accent/10 rounded-full text-xs text-accent">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                      AI Recommendations
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => router.push(`/dashboard?analysisId=${analysisId}`)}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-accent text-accent-foreground rounded-xl text-base font-semibold hover:bg-accent/90 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 whitespace-nowrap"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                  </svg>
                  Back to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </main>
  )
}
