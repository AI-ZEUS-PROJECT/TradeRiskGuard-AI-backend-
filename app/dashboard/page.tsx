import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { RiskMetrics } from "@/components/dashboard/risk-metrics"
import { TradeMetrics } from "@/components/dashboard/trade-metrics"
import { RiskCharts } from "@/components/dashboard/risk-charts"
import { TradesList } from "@/components/dashboard/trades-list"
import { RecommendationsBox } from "@/components/dashboard/recommendations"

export default function DashboardPage() {
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
