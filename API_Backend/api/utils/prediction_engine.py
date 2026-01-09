"""
Prediction engine for generating risk alerts
"""
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import statistics
from collections import Counter

class PredictionEngine:
    """Engine for generating predictive risk alerts"""
    
    def __init__(self, metrics: Dict[str, Any], trades_data: List[Dict], risk_results: Dict[str, Any]):
        self.metrics = metrics
        self.trades_data = trades_data
        self.risk_results = risk_results
        self.df = pd.DataFrame(trades_data) if trades_data else pd.DataFrame()
        
    def generate_all_alerts(self, timeframe: str = "next_week") -> List[Dict[str, Any]]:
        """Generate all predictive alerts"""
        alerts = []
        
        # Generate alerts based on different detection methods
        alerts.extend(self._detect_pattern_alerts(timeframe))
        alerts.extend(self._detect_behavioral_alerts(timeframe))
        alerts.extend(self._detect_time_based_alerts(timeframe))
        
        # Filter by confidence and sort by severity
        alerts = [alert for alert in alerts if alert.get("confidence", 0) >= 0.6]
        alerts.sort(key=lambda x: self._severity_to_score(x["severity"]), reverse=True)
        
        return alerts
    
    def _severity_to_score(self, severity: str) -> int:
        """Convert severity string to numeric score for sorting"""
        scores = {"low": 1, "medium": 2, "high": 3, "critical": 4}
        return scores.get(severity.lower(), 0)
    
    def _detect_pattern_alerts(self, timeframe: str) -> List[Dict[str, Any]]:
        """Detect pattern-based alerts"""
        alerts = []
        
        if self.df.empty or len(self.df) < 5:
            return alerts
        
        try:
            # Convert timestamps if needed
            if 'entry_time' in self.df.columns:
                self.df['entry_time'] = pd.to_datetime(self.df['entry_time'])
                self.df = self.df.sort_values('entry_time')
            
            # Check for consecutive losses pattern
            if 'profit_loss' in self.df.columns:
                profit_series = self.df['profit_loss']
                
                # Pattern: Consecutive losses leading to revenge trading
                consecutive_losses = self._count_consecutive_losses(profit_series)
                if consecutive_losses >= 2:
                    confidence = min(0.9, 0.6 + (consecutive_losses - 2) * 0.15)
                    alerts.append({
                        "alert_type": "pattern",
                        "severity": "high" if consecutive_losses >= 3 else "medium",
                        "title": f"Consecutive Losses Pattern",
                        "description": f"You've had {consecutive_losses} consecutive losses. "
                                     f"Traders often make emotional decisions after multiple losses.",
                        "confidence": confidence,
                        "timeframe": "next_trade",
                        "suggested_actions": [
                            "Take a break before your next trade",
                            "Review your trading plan",
                            "Stick to predefined position sizes"
                        ],
                        "trigger_conditions": {
                            "pattern": "consecutive_losses",
                            "count": consecutive_losses,
                            "probability": 0.75
                        }
                    })
            
            # Pattern: Win streak leading to overconfidence
            if 'profit_loss' in self.df.columns:
                consecutive_wins = self._count_consecutive_wins(self.df['profit_loss'])
                if consecutive_wins >= 3:
                    alerts.append({
                        "alert_type": "pattern",
                        "severity": "medium",
                        "title": "Win Streak Alert",
                        "description": f"After {consecutive_wins} consecutive wins, traders often "
                                     f"increase risk beyond their plan due to overconfidence.",
                        "confidence": 0.7,
                        "timeframe": "next_trade",
                        "suggested_actions": [
                            "Maintain consistent position sizing",
                            "Review if recent wins were due to skill or luck",
                            "Don't deviate from your trading plan"
                        ],
                        "trigger_conditions": {
                            "pattern": "consecutive_wins",
                            "count": consecutive_wins
                        }
                    })
            
            # Pattern: Position size escalation
            if 'lot_size' in self.df.columns and len(self.df) >= 10:
                recent_trades = self.df.tail(5)
                earlier_trades = self.df.iloc[-10:-5] if len(self.df) >= 10 else self.df.iloc[:-5]
                
                if not earlier_trades.empty and not recent_trades.empty:
                    avg_recent_size = recent_trades['lot_size'].mean()
                    avg_earlier_size = earlier_trades['lot_size'].mean()
                    
                    if avg_recent_size > avg_earlier_size * 1.5:  # 50% increase
                        alerts.append({
                            "alert_type": "pattern",
                            "severity": "high",
                            "title": "Position Size Escalation",
                            "description": f"Your average position size increased by "
                                         f"{(avg_recent_size/avg_earlier_size - 1)*100:.0f}%. "
                                         f"This could indicate overtrading or emotional trading.",
                            "confidence": 0.75,
                            "timeframe": "next_week",
                            "suggested_actions": [
                                "Return to your standard position sizing",
                                "Review why position sizes increased",
                                "Set hard limits on maximum position size"
                            ],
                            "trigger_conditions": {
                                "pattern": "position_size_increase",
                                "increase_percent": (avg_recent_size/avg_earlier_size - 1) * 100,
                                "recent_avg": avg_recent_size,
                                "previous_avg": avg_earlier_size
                            }
                        })
            
        except Exception as e:
            print(f"Error in pattern detection: {e}")
        
        return alerts
    
    def _detect_behavioral_alerts(self, timeframe: str) -> List[Dict[str, Any]]:
        """Detect behavioral pattern alerts"""
        alerts = []
        
        if self.df.empty or len(self.df) < 10:
            return alerts
        
        try:
            # Behavioral: Trading frequency changes
            if 'entry_time' in self.df.columns:
                self.df['entry_time'] = pd.to_datetime(self.df['entry_time'])
                self.df['date'] = self.df['entry_time'].dt.date
                
                trades_by_date = self.df.groupby('date').size()
                if len(trades_by_date) >= 5:
                    recent_dates = sorted(trades_by_date.index)[-3:]
                    earlier_dates = sorted(trades_by_date.index)[-6:-3] if len(trades_by_date) >= 6 else []
                    
                    if earlier_dates:
                        recent_avg = trades_by_date[recent_dates].mean()
                        earlier_avg = trades_by_date[earlier_dates].mean()
                        
                        if recent_avg > earlier_avg * 2:  # Doubled trading frequency
                            alerts.append({
                                "alert_type": "behavioral",
                                "severity": "high",
                                "title": "Increased Trading Frequency",
                                "description": f"Your trading frequency increased from "
                                             f"{earlier_avg:.1f} to {recent_avg:.1f} trades per day. "
                                             f"This could indicate overtrading.",
                                "confidence": 0.8,
                                "timeframe": "next_week",
                                "suggested_actions": [
                                    "Set a daily trade limit",
                                    "Take a trading break",
                                    "Review your trading strategy"
                                ],
                                "trigger_conditions": {
                                    "pattern": "increased_frequency",
                                    "increase_percent": (recent_avg/earlier_avg - 1) * 100,
                                    "recent_avg": recent_avg,
                                    "previous_avg": earlier_avg
                                }
                            })
            
            # Behavioral: Stop-loss discipline
            if 'stop_loss' in self.df.columns:
                sl_missing = self.df['stop_loss'].isna() | (self.df['stop_loss'] == 0)
                sl_missing_rate = sl_missing.mean()
                
                if sl_missing_rate > 0.3:  # More than 30% missing stop-loss
                    alerts.append({
                        "alert_type": "behavioral",
                        "severity": "critical" if sl_missing_rate > 0.5 else "high",
                        "title": "Stop-Loss Discipline Issue",
                        "description": f"{sl_missing_rate*100:.0f}% of your trades are missing stop-loss orders. "
                                     f"This exposes you to unlimited risk.",
                        "confidence": 0.9,
                        "timeframe": "next_trade",
                        "suggested_actions": [
                            "Always set a stop-loss before entering a trade",
                            "Use automatic stop-loss orders",
                            "Review your risk management rules"
                        ],
                        "trigger_conditions": {
                            "pattern": "missing_stop_loss",
                            "missing_rate": sl_missing_rate,
                            "trades_without_sl": sl_missing.sum()
                        }
                    })
            
            # Behavioral: Time since last loss reaction
            if 'profit_loss' in self.df.columns and 'entry_time' in self.df.columns:
                loss_indices = self.df[self.df['profit_loss'] < 0].index
                if len(loss_indices) >= 2:
                    # Check time between loss and next trade
                    for i in range(len(loss_indices) - 1):
                        loss_time = self.df.loc[loss_indices[i], 'entry_time']
                        next_trade_time = self.df.loc[loss_indices[i] + 1, 'entry_time'] if loss_indices[i] + 1 < len(self.df) else None
                        
                        if next_trade_time:
                            time_diff = (next_trade_time - loss_time).total_seconds() / 3600  # hours
                            if time_diff < 2:  # Trade within 2 hours of a loss
                                alerts.append({
                                    "alert_type": "behavioral",
                                    "severity": "high",
                                    "title": "Quick Trade After Loss",
                                    "description": f"You traded within {time_diff:.1f} hours of a loss. "
                                                 f"This could be revenge trading.",
                                    "confidence": 0.7,
                                    "timeframe": "next_trade",
                                    "suggested_actions": [
                                        "Wait at least 4 hours after a loss",
                                        "Review your emotional state before trading",
                                        "Stick to your trading schedule"
                                    ],
                                    "trigger_conditions": {
                                        "pattern": "quick_trade_after_loss",
                                        "hours_after_loss": time_diff,
                                        "loss_amount": self.df.loc[loss_indices[i], 'profit_loss']
                                    }
                                })
                                break
            
        except Exception as e:
            print(f"Error in behavioral detection: {e}")
        
        return alerts
    
    def _detect_time_based_alerts(self, timeframe: str) -> List[Dict[str, Any]]:
        """Detect time-based pattern alerts"""
        alerts = []
        
        if self.df.empty or len(self.df) < 15:
            return alerts
        
        try:
            # Time of day analysis
            if 'entry_time' in self.df.columns:
                self.df['entry_time'] = pd.to_datetime(self.df['entry_time'])
                self.df['hour'] = self.df['entry_time'].dt.hour
                
                # Group by hour and calculate win rate
                if 'profit_loss' in self.df.columns:
                    hourly_stats = []
                    for hour in range(24):
                        hour_trades = self.df[self.df['hour'] == hour]
                        if len(hour_trades) >= 3:
                            win_rate = (hour_trades['profit_loss'] > 0).mean()
                            avg_profit = hour_trades['profit_loss'].mean()
                            hourly_stats.append({
                                'hour': hour,
                                'trades': len(hour_trades),
                                'win_rate': win_rate,
                                'avg_profit': avg_profit
                            })
                    
                    if hourly_stats:
                        # Find worst performing hour
                        worst_hour = min(hourly_stats, key=lambda x: x['win_rate'])
                        best_hour = max(hourly_stats, key=lambda x: x['win_rate'])
                        
                        if worst_hour['trades'] >= 5 and worst_hour['win_rate'] < 0.3:
                            alerts.append({
                                "alert_type": "time_based",
                                "severity": "medium",
                                "title": f"Weak Trading Hour ({worst_hour['hour']}:00)",
                                "description": f"Your win rate is only {worst_hour['win_rate']*100:.0f}% "
                                             f"during {worst_hour['hour']}:00 hour. Consider avoiding "
                                             f"trading during this time.",
                                "confidence": 0.65,
                                "timeframe": "next_day",
                                "suggested_actions": [
                                    f"Avoid trading at {worst_hour['hour']}:00",
                                    "Analyze why this hour performs poorly",
                                    "Focus on your best hours instead"
                                ],
                                "trigger_conditions": {
                                    "pattern": "weak_trading_hour",
                                    "hour": worst_hour['hour'],
                                    "win_rate": worst_hour['win_rate'],
                                    "trade_count": worst_hour['trades']
                                }
                            })
            
            # Day of week analysis
            if 'entry_time' in self.df.columns:
                self.df['day_of_week'] = self.df['entry_time'].dt.day_name()
                
                if 'profit_loss' in self.df.columns:
                    day_stats = []
                    for day in ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']:
                        day_trades = self.df[self.df['day_of_week'] == day]
                        if len(day_trades) >= 3:
                            win_rate = (day_trades['profit_loss'] > 0).mean()
                            day_stats.append({
                                'day': day,
                                'trades': len(day_trades),
                                'win_rate': win_rate
                            })
                    
                    if len(day_stats) >= 3:
                        worst_day = min(day_stats, key=lambda x: x['win_rate'])
                        if worst_day['trades'] >= 5 and worst_day['win_rate'] < 0.35:
                            alerts.append({
                                "alert_type": "time_based",
                                "severity": "medium",
                                "title": f"Weak Trading Day ({worst_day['day']})",
                                "description": f"Your win rate is only {worst_day['win_rate']*100:.0f}% "
                                             f"on {worst_day['day']}s. Consider adjusting your "
                                             f"trading schedule.",
                                "confidence": 0.6,
                                "timeframe": "next_week",
                                "suggested_actions": [
                                    f"Reduce trading on {worst_day['day']}s",
                                    "Analyze market conditions on this day",
                                    "Focus on preparation instead of trading"
                                ],
                                "trigger_conditions": {
                                    "pattern": "weak_trading_day",
                                    "day": worst_day['day'],
                                    "win_rate": worst_day['win_rate'],
                                    "trade_count": worst_day['trades']
                                }
                            })
            
        except Exception as e:
            print(f"Error in time-based detection: {e}")
        
        return alerts
    
    def _count_consecutive_losses(self, profit_series: pd.Series) -> int:
        """Count consecutive losses at the end of the series"""
        count = 0
        for profit in reversed(profit_series):
            if profit < 0:
                count += 1
            else:
                break
        return count
    
    def _count_consecutive_wins(self, profit_series: pd.Series) -> int:
        """Count consecutive wins at the end of the series"""
        count = 0
        for profit in reversed(profit_series):
            if profit > 0:
                count += 1
            else:
                break
        return count
    
    def _calculate_alert_severity(self, probability: float, impact: float) -> str:
        """Calculate alert severity based on probability and impact"""
        risk_score = probability * impact
        
        if risk_score >= 0.8:
            return "critical"
        elif risk_score >= 0.6:
            return "high"
        elif risk_score >= 0.4:
            return "medium"
        else:
            return "low"