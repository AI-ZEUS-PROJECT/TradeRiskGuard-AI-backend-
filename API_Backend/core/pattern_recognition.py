"""
AI Pattern Recognition Engine
Uses Heuristic Analysis + ML Clustering to find hidden trading habits.
"""
import pandas as pd
import numpy as np
from typing import Dict, List, Any
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

class PatternDetector:
    """Detects hidden patterns in trading history using ML and Heuristics"""
    
    def __init__(self, df: pd.DataFrame):
        self.df = df
        self.patterns = []
        
        # Ensure we have datetime objects
        if 'entry_time' in self.df.columns:
            self.df['entry_time'] = pd.to_datetime(self.df['entry_time'])
        
        # Calculate duration if missing
        if 'duration' not in self.df.columns and 'exit_time' in self.df.columns:
            self.df['exit_time'] = pd.to_datetime(self.df['exit_time'])
            self.df['duration_minutes'] = (self.df['exit_time'] - self.df['entry_time']).dt.total_seconds() / 60
        elif 'duration' in self.df.columns:
            self.df['duration_minutes'] = self.df['duration'] / 60

    def detect_all_patterns(self) -> List[Dict[str, Any]]:
        """Run all detection algorithms"""
        if self.df.empty or len(self.df) < 5:
            return []

        self._detect_hourly_performance()
        self._detect_duration_performance()
        
        # ML Clustering (needs more data)
        if len(self.df) >= 20:
            self._cluster_losing_trades()
            
        return self.patterns

    def _detect_hourly_performance(self):
        """Analyze win rate by hour of day (Heuristic)"""
        try:
            df = self.df.copy()
            df['hour'] = df['entry_time'].dt.hour
            
            # Group by hour
            hourly = df.groupby('hour').agg({
                'profit_loss': ['count', 'sum', lambda x: (x > 0).mean()]
            })
            hourly.columns = ['count', 'total_pnl', 'win_rate']
            
            # Find worst hours (Win Rate < 40% AND Count > 3)
            bad_hours = hourly[(hourly['win_rate'] < 0.40) & (hourly['count'] >= 3)]
            
            for hour, row in bad_hours.iterrows():
                self.patterns.append({
                    "name": "Time-of-Day Fatigue",
                    "type": "heuristic",
                    "confidence": "high",
                    "description": f"You struggle around {hour}:00 - {hour+1}:00.",
                    "details": {
                        "hour": int(hour),
                        "win_rate": round(row['win_rate'] * 100, 1),
                        "total_loss": round(row['total_pnl'], 2),
                        "trade_count": int(row['count'])
                    },
                    "suggestion": f"Avoid trading between {hour}:00 and {hour+1}:00 or take a break."
                })
                
        except Exception as e:
            print(f"Error in hourly detection: {e}")

    def _detect_duration_performance(self):
        """Analyze quick scalps vs long holds (Heuristic)"""
        try:
            df = self.df.copy()
            # Define "Quick" (< 15 mins) vs "Long" (> 4 hours)
            df['type'] = np.where(df['duration_minutes'] < 15, 'Scalp', 
                         np.where(df['duration_minutes'] > 240, 'Swing', 'Intraday'))
            
            stats = df.groupby('type').agg({
                'profit_loss': ['count', 'sum', lambda x: (x > 0).mean()]
            })
            stats.columns = ['count', 'total_pnl', 'win_rate']
            
            # Check for significant difference
            for t_type, row in stats.iterrows():
                if row['win_rate'] < 0.35 and row['count'] >= 5:
                    self.patterns.append({
                        "name": f"Weak {t_type} Performance",
                        "type": "heuristic",
                        "confidence": "medium",
                        "description": f"You have difficulty with {t_type} trades (Win Rate: {row['win_rate']:.0%}).",
                        "details": {
                            "trade_type": t_type,
                            "win_rate": round(row['win_rate'] * 100, 1)
                        },
                        "suggestion": "Review your strategy for this timeframe."
                    })
                    
        except Exception as e:
            print(f"Error in duration detection: {e}")

    def _cluster_losing_trades(self):
        """Use K-Means to find common characteristics of losing trades (ML)"""
        try:
            # Filter only losers
            losers = self.df[self.df['profit_loss'] < 0].copy()
            if len(losers) < 10:
                return

            # Features to cluster: Duration, Lot/Stake, Hour
            features = pd.DataFrame()
            features['duration'] = losers['duration_minutes']
            features['size'] = losers.get('lot_size', losers.get('stake', 0)) # handle deriv vs standard
            features['hour'] = losers['entry_time'].dt.hour
            
            # Fill NA
            features = features.fillna(0)
            
            # Normalize
            scaler = StandardScaler()
            X = scaler.fit_transform(features)
            
            # Cluster (Force 2 clusters to find 'the main type of loss')
            kmeans = KMeans(n_clusters=2, random_state=42, n_init=10)
            losers['cluster'] = kmeans.fit_predict(X)
            
            # Analyze clusters
            for c in [0, 1]:
                cluster_data = losers[losers['cluster'] == c]
                if len(cluster_data) < 5: 
                    continue
                
                # Get centroids (denormalized roughly via averages)
                avg_dur = cluster_data['duration_minutes'].mean()
                avg_size = cluster_data.get('lot_size', cluster_data.get('stake', 0)).mean()
                
                # Check if this cluster is "significant" (e.g. very short duration or very high size)
                # This is "interpreting" the cluster
                
                desc_parts = []
                if avg_dur < 10:
                    desc_parts.append("Very short duration")
                elif avg_dur > 1000:
                    desc_parts.append("Long holding times")
                    
                if avg_size > self.df.get('lot_size', self.df.get('stake', 0)).mean() * 1.5:
                    desc_parts.append("Large position sizes")
                
                if desc_parts:
                    self.patterns.append({
                        "name": "Recurring Loss Pattern",
                        "type": "ml_cluster",
                        "confidence": "high",
                        "description": f"AI identified a group of {len(cluster_data)} similar losses: " + " + ".join(desc_parts),
                        "details": {
                            "avg_duration_min": round(avg_dur, 1),
                            "avg_size": round(avg_size, 2),
                            "count": len(cluster_data)
                        },
                        "suggestion": "This combination (Size/Duration) consistently leads to losses."
                    })

        except Exception as e:
            print(f"Error in ML clustering: {e}")
