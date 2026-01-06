"use client"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { ArrowRight, TrendingUp, Shield, Zap, Brain } from "lucide-react"
import Link from "next/link"

export default function AboutPage() {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Analysis",
      description:
        "Advanced machine learning algorithms analyze your trading patterns and identify risk factors automatically.",
    },
    {
      icon: Shield,
      title: "Risk Management",
      description: "Comprehensive risk assessment tools help you understand your exposure and make informed decisions.",
    },
    {
      icon: TrendingUp,
      title: "Performance Insights",
      description: "Detailed metrics on your trading performance with actionable recommendations for improvement.",
    },
    {
      icon: Zap,
      title: "Real-Time Updates",
      description: "Get instant analysis results and download reports whenever you need them.",
    },
  ]

  const team = [
    { name: "Risk Analysis", role: "Powered by sophisticated algorithms" },
    { name: "Data Security", role: "Your data is encrypted and protected" },
    { name: "User Experience", role: "Designed for traders, by traders" },
  ]

  return (
    <main className="flex flex-col min-h-screen">
      <Header />
      <div className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background py-20 sm:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center animate-slideUp">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                About{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                  Trade Guard AI
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground mb-8 leading-relaxed max-w-2xl mx-auto">
                We're on a mission to empower traders with AI-driven insights that transform raw trading data into
                actionable intelligence.
              </p>
            </div>
          </div>

          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10 animate-pulse-soft" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl -z-10 animate-pulse-soft" />
        </section>

        {/* Mission Section */}
        <section className="py-20 sm:py-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="animate-slideUp">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">Our Mission</h2>
              <p className="text-muted-foreground text-lg mb-4 leading-relaxed">
                Trade Guard AI was created to solve a critical problem in the trading community: the difficulty of
                analyzing and managing trading risk at scale.
              </p>
              <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
                We believe every trader deserves access to institutional-grade risk analysis tools. Our platform
                democratizes these capabilities, making advanced AI analysis accessible to traders of all levels.
              </p>
              <Link
                href="#features"
                className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-semibold transition-all duration-300 hover:gap-3"
              >
                Learn about our features
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4 animate-slideUp" style={{ animationDelay: "0.1s" }}>
              {[
                { number: "10k+", label: "Trades Analyzed" },
                { number: "500+", label: "Active Users" },
                { number: "95%", label: "Accuracy Rate" },
                { number: "24/7", label: "Support" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-card/50 border border-border/30 rounded-lg p-6 hover:border-primary/50 transition-all duration-300 hover:bg-card/70"
                >
                  <p className="text-2xl sm:text-3xl font-bold text-primary mb-2">{stat.number}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 sm:py-32 bg-card/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 animate-slideUp">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Why Choose Trade Guard AI?</h2>
              <p className="text-muted-foreground text-lg">Powerful features designed for serious traders</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <div
                    key={index}
                    className="bg-background border border-border/20 rounded-xl p-6 hover:border-primary/50 transition-all duration-300 hover:bg-card/30 hover:shadow-lg group animate-slideUp"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-20 sm:py-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-12 text-center animate-slideUp">
            Our Core Values
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Accuracy",
                description: "We prioritize precision in every analysis, using industry-leading AI models.",
              },
              {
                title: "Transparency",
                description: "Your data is yours. We're transparent about how we analyze and use your information.",
              },
              {
                title: "Innovation",
                description: "We continuously improve our platform with the latest advances in AI and data science.",
              },
            ].map((value, index) => (
              <div
                key={index}
                className="bg-card/50 border border-border/30 rounded-xl p-8 text-center hover:border-primary/50 transition-all duration-300 hover:bg-card/70 animate-slideUp"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <h3 className="text-xl font-semibold text-foreground mb-3">{value.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 sm:py-32 bg-gradient-to-r from-primary/5 to-accent/5">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center animate-slideUp">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">Ready to Guard Your Trades?</h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
              Join thousands of traders who are already using Trade Guard AI to manage their risk smarter.
            </p>
            <Link
              href="/#upload"
              className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-lg font-semibold hover:shadow-lg hover:shadow-primary/50 transition-all duration-300 hover:scale-105 active:scale-95"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </div>
      <Footer />
    </main>
  )
}
