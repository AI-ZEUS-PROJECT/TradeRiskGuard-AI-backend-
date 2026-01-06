"use client"

import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const drawdownData = [
  { month: "Jan", value: 4.2 },
  { month: "Feb", value: 7.1 },
  { month: "Mar", value: 5.8 },
  { month: "Apr", value: 9.2 },
  { month: "May", value: 6.5 },
  { month: "Jun", value: 12.5 },
]

const exposureData = [
  { currency: "EUR", exposure: 35 },
  { currency: "GBP", exposure: 28 },
  { currency: "JPY", exposure: 22 },
  { currency: "AUD", exposure: 15 },
]

export function RiskCharts() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Drawdown Chart */}
      <div className="p-6 rounded-xl bg-card/50 border border-border/30">
        <h3 className="text-lg font-semibold text-foreground mb-4">Maximum Drawdown Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={drawdownData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="month" stroke="var(--color-muted-foreground)" />
            <YAxis stroke="var(--color-muted-foreground)" />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-card)",
                border: `1px solid var(--color-border)`,
                borderRadius: "8px",
              }}
            />
            <Line type="monotone" dataKey="value" stroke="var(--color-destructive)" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Exposure Chart */}
      <div className="p-6 rounded-xl bg-card/50 border border-border/30">
        <h3 className="text-lg font-semibold text-foreground mb-4">Currency Exposure</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={exposureData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="currency" stroke="var(--color-muted-foreground)" />
            <YAxis stroke="var(--color-muted-foreground)" />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-card)",
                border: `1px solid var(--color-border)`,
                borderRadius: "8px",
              }}
            />
            <Bar dataKey="exposure" fill="var(--color-primary)" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
