import { TrendingUp, TrendingDown } from "lucide-react"

type TradesListProps = {
  analysis: any | null
}

export function TradesList({ analysis }: TradesListProps) {
  // Note: The backend doesn't store individual trade details, only metrics
  // For now, we'll show a message about this
  const metrics = analysis?.metrics || {}
  return (
    <div className="rounded-xl bg-card/50 border border-border/30 overflow-hidden">
      <div className="p-6 border-b border-border/20">
        <h3 className="text-lg font-semibold text-foreground">Trade Summary</h3>
      </div>

      {analysis ? (
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-card/30 rounded-lg border border-border/20">
              <p className="text-xs text-muted-foreground uppercase mb-1">Total Trades</p>
              <p className="text-2xl font-bold text-foreground">{metrics.total_trades || 0}</p>
            </div>
            <div className="p-4 bg-card/30 rounded-lg border border-border/20">
              <p className="text-xs text-muted-foreground uppercase mb-1">Winning Trades</p>
              <p className="text-2xl font-bold text-success">{metrics.winning_trades || 0}</p>
            </div>
            <div className="p-4 bg-card/30 rounded-lg border border-border/20">
              <p className="text-xs text-muted-foreground uppercase mb-1">Losing Trades</p>
              <p className="text-2xl font-bold text-destructive">{metrics.losing_trades || 0}</p>
            </div>
            <div className="p-4 bg-card/30 rounded-lg border border-border/20">
              <p className="text-xs text-muted-foreground uppercase mb-1">Win Rate</p>
              <p className="text-2xl font-bold text-primary">{(metrics.win_rate || 0).toFixed(1)}%</p>
            </div>
          </div>
          <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Net P&L:</strong> <span className={`font-bold ${(metrics.net_profit || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>${(metrics.net_profit || 0).toFixed(2)}</span>
              {" | "}
              <strong>Avg Win:</strong> <span className="text-success">${(metrics.avg_win || 0).toFixed(2)}</span>
              {" | "}
              <strong>Avg Loss:</strong> <span className="text-destructive">${(metrics.avg_loss || 0).toFixed(2)}</span>
              {" | "}
              <strong>Profit Factor:</strong> <span className="text-foreground">{(metrics.profit_factor || 0).toFixed(2)}</span>
            </p>
          </div>
        </div>
      ) : (
        <div className="p-6 text-center text-muted-foreground">
          No trade data available. Upload CSV to analyze trades.
        </div>
      )}
    </div>
  )
}
