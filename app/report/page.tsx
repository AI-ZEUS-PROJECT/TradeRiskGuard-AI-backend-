import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { ReportHeader } from "@/components/report/report-header"
import { ReportSections } from "@/components/report/report-sections"
import { ReportPreview } from "@/components/report/report-preview"

export default function ReportPage() {
  return (
    <main className="flex flex-col min-h-screen bg-background">
      <Header />
      <div className="flex-1">
        <ReportHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <ReportSections />
            </div>
            <div>
              <ReportPreview />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
