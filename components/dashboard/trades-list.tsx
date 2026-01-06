import { TrendingUp, TrendingDown } from "lucide-react"

const trades = [
  {
    id: 1,
    date: "2024-01-20",
    symbol: "AUDUSD",
    type: "Long",
    qty: 1.0,
    entry: 0.675,
    exit: 0.678,
    pnl: 30.0,
    duration: "2h 10m",
  },
  {
    id: 2,
    date: "2024-01-19",
    symbol: "EURUSD",
    type: "Long",
    qty: 1.5,
    entry: 1.085,
    exit: 1.095,
    pnl: 150.0,
    duration: "3h 20m",
  },
  {
    id: 3,
    date: "2024-01-18",
    symbol: "USDJPY",
    type: "Long",
    qty: 0.5,
    entry: 148.5,
    exit: 148.8,
    pnl: 150.0,
    duration: "1h 30m",
  },
  {
    id: 4,
    date: "2024-01-17",
    symbol: "EURUSD",
    type: "Short",
    qty: 2.0,
    entry: 1.09,
    exit: 1.088,
    pnl: -40.0,
    duration: "4h 45m",
  },
  {
    id: 5,
    date: "2024-01-16",
    symbol: "GBPUSD",
    type: "Short",
    qty: 1.0,
    entry: 1.265,
    exit: 1.262,
    pnl: -30.0,
    duration: "1h 15m",
  },
]

export function TradesList() {
  return (
    <div className="rounded-xl bg-card/50 border border-border/30 overflow-hidden">
      <div className="p-6 border-b border-border/20">
        <h3 className="text-lg font-semibold text-foreground">Recent Trades</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-card/50 border-b border-border/20">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Symbol
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Entry
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Exit
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                P&L
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Duration
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {trades.map((trade) => (
              <tr key={trade.id} className="hover:bg-card/50 transition-colors">
                <td className="px-6 py-4 text-sm text-foreground">{trade.date}</td>
                <td className="px-6 py-4 text-sm font-medium text-foreground">{trade.symbol}</td>
                <td className="px-6 py-4 text-sm">
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                      trade.type === "Long" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {trade.type === "Long" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {trade.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-foreground">{trade.entry}</td>
                <td className="px-6 py-4 text-sm text-foreground">{trade.exit}</td>
                <td className="px-6 py-4 text-sm font-medium">
                  <span className={trade.pnl >= 0 ? "text-success" : "text-destructive"}>
                    {trade.pnl >= 0 ? "+" : ""} ${trade.pnl.toFixed(2)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{trade.duration}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
