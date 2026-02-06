"use client"

import type React from "react"
import { useState } from "react"
import { Upload, Download, FileText, CheckCircle, X } from "lucide-react"
import { apiClient } from "@/lib/api"

interface DashboardUploadProps {
  isOpen: boolean
  onClose: () => void
  onUploadSuccess: (analysisId: string) => void
}

export function DashboardUpload({ isOpen, onClose, onUploadSuccess }: DashboardUploadProps) {
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
        setError(null)
      } else {
        setError("Only CSV files are supported.")
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

      // Call success callback with analysis ID
      if (analysisId) {
        onUploadSuccess(analysisId)
        handleClose()
      } else {
        setError("Analysis completed but no ID returned.")
      }
    } catch (e) {
      setError("Something went wrong while analyzing your trades. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setFile(null)
    setError(null)
    setIsLoading(false)
    onClose()
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl mx-4 bg-card border border-border rounded-xl shadow-2xl animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/30">
          <div>
            <h2 className="text-xl font-bold text-foreground">Upload New Trades</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Upload your CSV file to analyze your trading data
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-card/50 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Upload Zone */}
          <div
            className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-300 ${
              dragActive
                ? "border-primary bg-primary/5 scale-[1.02]"
                : "border-border/30 hover:border-primary/50 bg-card/20 hover:bg-card/40"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="dashboard-csv-input"
              accept=".csv"
              onChange={handleChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />

            <label htmlFor="dashboard-csv-input" className="cursor-pointer block">
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
            <div className="mt-4 p-4 bg-card/50 border border-border/30 rounded-lg flex items-center justify-between animate-slideUp hover:border-primary/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <FileText className="w-5 h-5 text-primary" />
                  <CheckCircle className="w-3 h-3 text-green-500 absolute -bottom-1 -right-1" />
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
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <button
              onClick={handleUpload}
              disabled={!file || isLoading}
              className={`flex-1 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                file && !isLoading
                  ? "bg-gradient-to-r from-primary to-accent text-primary-foreground hover:shadow-lg hover:shadow-primary/50 hover:scale-[1.02] active:scale-95 cursor-pointer"
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
              className="flex-1 py-3 rounded-lg font-semibold border border-border hover:bg-card/50 text-foreground transition-all duration-300 flex items-center justify-center gap-2 hover:border-primary/50 hover:scale-[1.02] active:scale-95"
            >
              <Download className="w-4 h-4" />
              Download Sample
            </button>
          </div>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-card/30 border border-border/20 rounded-lg hover:border-primary/30 transition-colors">
            <h3 className="font-semibold text-foreground mb-2 text-sm">CSV Format Requirements</h3>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>• Include columns: Date, Symbol, Quantity, EntryPrice, ExitPrice, PnL, TradeType</li>
              <li>• Date format: YYYY-MM-DD</li>
              <li>• TradeType: Long or Short</li>
              <li>• Maximum file size: 10 MB</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
