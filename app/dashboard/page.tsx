"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { RiskMetrics } from "@/components/dashboard/risk-metrics"
import { TradeMetrics } from "@/components/dashboard/trade-metrics"
import { RiskCharts } from "@/components/dashboard/risk-charts"
import { TradesList } from "@/components/dashboard/trades-list"
import { RecommendationsBox } from "@/components/dashboard/recommendations"
import { useAuth } from "@/contexts/auth-context"

export default function DashboardPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/signin")
    }
  }, [isAuthenticated, isLoading, router])

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
        <DashboardHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <RiskMetrics />
          <TradeMetrics />
          <RiskCharts />
          <RecommendationsBox />
          <TradesList />
        </div>
      </div>
      <Footer />
    </main>
  )
}
