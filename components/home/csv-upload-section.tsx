"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Upload, Download, FileText, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { apiClient } from "@/lib/api"

export function CSVUploadSection() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile.type === "text/csv" || droppedFile.name.endsWith(".csv")) {
        setFile(droppedFile)
      }
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setError(null)
    }
  }

  const handleUpload = async () => {
    setError(null)

    if (!file) {
      setError("Please select a CSV file to analyze.")
      return
    }

    // Check if user is authenticated
    if (!isAuthenticated) {
      router.push("/signin")
      return
      return
    }

    // Basic client-side validation
    if (!(file.type === "text/csv" || file.name.toLowerCase().endsWith(".csv"))) {
      setError("Only CSV files are supported.")
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File is too large. Maximum size is 10MB.")
      return
    }

    setIsLoading(true)

    try {
      const response = await apiClient.analyzeTrades({ file })

      if (!response.success || !response.data) {
        setError(response.error || response.message || "Failed to analyze trades. Please try again.")
        return
      }

      const analysisId = (response.data as any).analysis_id

      // Redirect to dashboard, optionally with analysis id in query
      if (analysisId) {
        router.push(`/dashboard?analysisId=${encodeURIComponent(analysisId)}`)
      } else {
        router.push("/dashboard")
      }
    } catch (e) {
      setError("Something went wrong while analyzing your trades. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const downloadSample = () => {
    const sampleCSV = `Date,Symbol,Quantity,EntryPrice,ExitPrice,PnL,TradeType,Duration
2024-01-15,EURUSD,1.5,1.0850,1.0920,105.00,Long,2h 30m
2024-01-16,GBPUSD,1.0,1.2650,1.2620,-30.00,Short,1h 15m
2024-01-17,EURUSD,2.0,1.0900,1.0880,-40.00,Short,4h 45m
2024-01-18,USDJPY,0.5,148.50,148.80,150.00,Long,1h 30m
2024-01-19,EURUSD,1.5,1.0850,1.0950,150.00,Long,3h 20m
2024-01-20,AUDUSD,1.0,0.6750,0.6780,30.00,Long,2h 10m`

    const element = document.createElement("a")
    element.setAttribute("href", "data:text/csv;charset=utf-8," + encodeURIComponent(sampleCSV))
    element.setAttribute("download", "sample_trades.csv")
    element.style.display = "none"
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  return (
    <section id="upload" className="py-20 sm:py-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12 animate-slideUp">
        <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Upload Your Trades</h2>
        <p className="text-muted-foreground text-lg">
          Drag and drop your CSV file or click to select from your computer
        </p>
      </div>

      <div className="max-w-2xl mx-auto animate-slideUp" style={{ animationDelay: "0.1s" }}>
        {error && (
          <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Upload Zone */}
        <div
          className={`relative border-2 border-dashed rounded-xl p-8 sm:p-12 transition-all duration-300 ${
            dragActive
              ? "border-primary bg-primary/5 scale-105"
              : "border-border/30 hover:border-primary/50 bg-card/20 hover:bg-card/40"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="csv-input"
            accept=".csv"
            onChange={handleChange}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />

          <label htmlFor="csv-input" className="cursor-pointer block">
            <div className="flex flex-col items-center justify-center gap-4">
              <div
                className={`p-4 rounded-lg transition-all duration-300 ${dragActive ? "bg-primary/20 scale-110" : "bg-primary/10"}`}
              >
                <Upload className={`w-8 h-8 transition-colors ${dragActive ? "text-primary" : "text-primary/70"}`} />
              </div>

              <div className="text-center">
                <p className="text-lg font-semibold text-foreground">{file ? file.name : "Drop your CSV file here"}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {file ? "File selected. Ready to analyze!" : "or click to browse your computer"}
                </p>
              </div>
            </div>
          </label>
        </div>

        {/* File Info */}
        {file && (
          <div className="mt-6 p-4 bg-card/50 border border-border/30 rounded-lg flex items-center justify-between animate-slideUp hover:border-primary/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="relative">
                <FileText className="w-5 h-5 text-primary" />
                <CheckCircle className="w-3 h-3 text-success absolute -bottom-1 -right-1" />
              </div>
              <div>
                <p className="font-medium text-foreground">{file.name}</p>
                <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
              </div>
            </div>
            <button
              onClick={() => setFile(null)}
              className="text-muted-foreground hover:text-foreground transition-colors text-sm hover:bg-card/50 px-3 py-1 rounded"
            >
              Remove
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <button
            onClick={handleUpload}
            disabled={!file || isLoading}
            className={`flex-1 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
              file && !isLoading
                ? "bg-gradient-to-r from-primary to-accent text-primary-foreground hover:shadow-lg hover:shadow-primary/50 hover:scale-105 active:scale-95 cursor-pointer"
                : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Analyze Trades
              </>
            )}
          </button>

          <button
            onClick={downloadSample}
            className="flex-1 py-3 rounded-lg font-semibold border border-border hover:bg-card/50 text-foreground transition-all duration-300 flex items-center justify-center gap-2 hover:border-primary/50 hover:scale-105 active:scale-95"
          >
            <Download className="w-4 h-4" />
            Download Sample
          </button>
        </div>

        {/* Info Box */}
        <div className="mt-8 p-6 bg-card/30 border border-border/20 rounded-lg hover:border-primary/30 transition-colors">
          <h3 className="font-semibold text-foreground mb-3">CSV Format Requirements</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Include columns: Date, Symbol, Quantity, EntryPrice, ExitPrice, PnL, TradeType</li>
            <li>• Date format: YYYY-MM-DD</li>
            <li>• TradeType: Long or Short</li>
            <li>• Maximum file size: 10 MB</li>
          </ul>
        </div>

        {/* CTA to Dashboard */}
        {isAuthenticated && (
          <div className="mt-8 text-center">
            <p className="text-muted-foreground mb-4">Already have data analyzed? View your dashboard to see insights.</p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-semibold transition-all duration-300 hover:gap-3"
            >
              Go to Dashboard
              <span className="text-lg">→</span>
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
