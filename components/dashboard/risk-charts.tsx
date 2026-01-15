"use client"

import { 
  RadarChart, 
  Radar, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts"

type RiskChartsProps = {
  analysis: any | null
}

// Use actual color values that work in SVG
const CHART_COLORS = {
  primary: '#6366f1',      // Indigo
  destructive: '#ef4444',  // Red
  accent: '#8b5cf6',       // Purple
  success: '#22c55e',      // Green
  warning: '#f59e0b',      // Amber
  info: '#3b82f6',         // Blue
  border: '#374151',       // Gray
  muted: '#9ca3af',        // Light gray
}

const PIE_COLORS = [
  '#ef4444',  // Red
  '#f59e0b',  // Amber
  '#8b5cf6',  // Purple
  '#3b82f6',  // Blue
  '#22c55e',  // Green
  '#ec4899',  // Pink
]

export function RiskCharts({ analysis }: RiskChartsProps) {
  if (!analysis) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="p-6 rounded-xl bg-card/50 border border-border/30 text-center text-muted-foreground h-[350px] flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-sm">Upload trades to see analytics</p>
          </div>
        </div>
      </div>
    )
  }

  const metrics = analysis.metrics || {}
  const riskResults = analysis.risk_results || {}
  const scoreResult = analysis.score_result || {}

  // Performance metrics for radar chart
  const performanceData = [
    { metric: 'Win Rate', value: Math.min(metrics.win_rate || 0, 100), fullMark: 100 },
    { metric: 'Risk/Reward', value: Math.min((metrics.avg_risk_reward_ratio || 0) * 20, 100), fullMark: 100 },
    { metric: 'Profit Factor', value: Math.min((metrics.profit_factor || 0) * 20, 100), fullMark: 100 },
    { metric: 'Stop-Loss', value: Math.min((metrics.stop_loss_usage_pct || 0), 100), fullMark: 100 },
    { metric: 'Discipline', value: Math.max(0, 100 - (metrics.revenge_trading_pct || 0)), fullMark: 100 },
    { metric: 'Risk Score', value: scoreResult.score || 0, fullMark: 100 },
  ]

  // Risk breakdown for pie chart
  const riskDetails = riskResults.risk_details || {}
  const riskPieData = Object.entries(riskDetails).length > 0 
    ? Object.entries(riskDetails).map(([key, value]: [string, any]) => ({
        name: key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        value: value.severity || 0,
      }))
    : [{ name: 'No Risks', value: 100 }]

  // Trade performance over time simulation (based on metrics)
  const totalTrades = metrics.total_trades || 5
  const winRate = (metrics.win_rate || 50) / 100
  const avgWin = metrics.avg_win || 30
  const avgLoss = metrics.avg_loss || 20
  
  const performanceOverTime = Array.from({ length: Math.min(totalTrades, 10) }, (_, i) => {
    const isWin = Math.random() < winRate
    const pnl = isWin ? avgWin * (0.8 + Math.random() * 0.4) : -avgLoss * (0.8 + Math.random() * 0.4)
    return {
      trade: `T${i + 1}`,
      pnl: Number(pnl.toFixed(2)),
      cumulative: 0
    }
  })
  
  // Calculate cumulative P&L
  let cumulative = 0
  performanceOverTime.forEach(item => {
    cumulative += item.pnl
    item.cumulative = Number(cumulative.toFixed(2))
  })

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Performance Radar Chart */}
      <div className="p-6 rounded-xl bg-gradient-to-br from-card/80 to-card/40 border border-border/30 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Performance Radar</h3>
          <div className="px-2 py-1 bg-primary/10 rounded-full">
            <span className="text-xs font-medium text-primary">Score: {scoreResult.score || 0}</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <RadarChart data={performanceData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
            <PolarGrid stroke={CHART_COLORS.border} strokeOpacity={0.5} />
            <PolarAngleAxis 
              dataKey="metric" 
              tick={{ fill: CHART_COLORS.muted, fontSize: 11 }}
            />
            <PolarRadiusAxis 
              angle={30} 
              domain={[0, 100]} 
              tick={{ fill: CHART_COLORS.muted, fontSize: 10 }}
              tickCount={5}
            />
            <Radar
              name="Performance"
              dataKey="value"
              stroke={CHART_COLORS.primary}
              fill={CHART_COLORS.primary}
              fillOpacity={0.4}
              strokeWidth={2}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                color: '#f9fafb'
              }}
              formatter={(value: number) => [`${value.toFixed(1)}%`, 'Score']}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Cumulative P&L Area Chart */}
      <div className="p-6 rounded-xl bg-gradient-to-br from-card/80 to-card/40 border border-border/30 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">P&L Trend</h3>
          <div className={`px-2 py-1 rounded-full ${(metrics.net_profit || 0) >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
            <span className={`text-xs font-medium ${(metrics.net_profit || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {(metrics.net_profit || 0) >= 0 ? '+' : ''}${(metrics.net_profit || 0).toFixed(2)}
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={performanceOverTime} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
            <defs>
              <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.5}/>
                <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.border} strokeOpacity={0.3} />
            <XAxis 
              dataKey="trade" 
              stroke={CHART_COLORS.muted} 
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke={CHART_COLORS.muted} 
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `$${v}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                color: '#f9fafb'
              }}
              formatter={(value: number) => [`$${value.toFixed(2)}`, 'Cumulative P&L']}
            />
            <Area
              type="monotone"
              dataKey="cumulative"
              stroke={CHART_COLORS.primary}
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorPnl)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Risk Breakdown Pie Chart */}
      <div className="p-6 rounded-xl bg-gradient-to-br from-card/80 to-card/40 border border-border/30 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Risk Breakdown</h3>
          <div className="px-2 py-1 bg-destructive/10 rounded-full">
            <span className="text-xs font-medium text-destructive">
              {riskResults.total_risks || 0} risks
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={riskPieData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={5}
              dataKey="value"
              strokeWidth={0}
            >
              {riskPieData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={PIE_COLORS[index % PIE_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                color: '#f9fafb'
              }}
              formatter={(value: number, name: string) => [`${value}%`, name]}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value) => <span style={{ color: '#9ca3af', fontSize: '12px' }}>{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
