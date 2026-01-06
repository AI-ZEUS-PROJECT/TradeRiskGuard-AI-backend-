import { CheckCircle2 } from "lucide-react"

const benefits = [
  "Identify and eliminate losing trading patterns",
  "Optimize position sizing based on risk tolerance",
  "Understand your portfolio concentration risks",
  "Make data-driven trading decisions",
  "Track and monitor risk metrics over time",
  "Generate professional risk reports",
]

export function BenefitsSection() {
  return (
    <section className="py-20 sm:py-32 bg-card/30 border-y border-border/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-8">Why Choose Risk Manager?</h2>
            <ul className="space-y-4">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground text-lg">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl blur-xl" />
            <div className="relative bg-card/50 border border-border/30 rounded-2xl p-8">
              <div className="space-y-4">
                <div className="h-3 bg-muted/40 rounded w-3/4" />
                <div className="h-3 bg-primary/40 rounded w-full" />
                <div className="h-3 bg-accent/40 rounded w-4/5" />
                <div className="h-3 bg-muted/40 rounded w-2/3" />
              </div>
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="h-24 bg-primary/10 rounded-lg border border-primary/20" />
                <div className="h-24 bg-accent/10 rounded-lg border border-accent/20" />
                <div className="h-24 bg-secondary/10 rounded-lg border border-secondary/20" />
                <div className="h-24 bg-muted/10 rounded-lg border border-muted/20" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
