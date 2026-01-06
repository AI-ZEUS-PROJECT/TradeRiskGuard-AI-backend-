import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { CSVUploadSection } from "@/components/home/csv-upload-section"
import { HeroSection } from "@/components/home/hero-section"
import { FeaturesSection } from "@/components/home/features-section"
import { BenefitsSection } from "@/components/home/benefits-section"

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen">
      <Header />
      <div className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <BenefitsSection />
        <CSVUploadSection />
      </div>
      <Footer />
    </main>
  )
}
