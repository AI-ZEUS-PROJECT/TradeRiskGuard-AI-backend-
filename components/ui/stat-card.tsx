import type React from "react"

interface StatCardProps {
  label: string
  value: string | number
  change?: string
  icon?: React.ReactNode
  color?: "primary" | "success" | "destructive" | "accent" | "secondary"
}

export function StatCard({ label, value, change, icon, color = "primary" }: StatCardProps) {
  const colorClasses = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    destructive: "bg-destructive/10 text-destructive",
    accent: "bg-accent/10 text-accent",
    secondary: "bg-secondary/10 text-secondary",
  }

  return (
    <div className="p-6 rounded-xl bg-card/50 border border-border/30 hover:border-primary/20 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {icon && <div className={`p-2.5 rounded-lg ${colorClasses[color]}`}>{icon}</div>}
      </div>
      <p className="text-2xl font-bold text-foreground mb-2">{value}</p>
      {change && (
        <p className={`text-xs font-medium ${change.startsWith("+") ? "text-success" : "text-destructive"}`}>
          {change}
        </p>
      )}
    </div>
  )
}
