"""
News Service for Sentiment Analysis and Economic Calendar Integration.
Currently uses a Mock implementation for demonstration.
"""
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import random

class NewsService:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key
        # Common high impact event times (UTC) for simulation
        # 13:30 (US Data), 19:00 (FOMC), 12:45 (ECB)
        self.risky_hours = [13, 19, 12] 
    
    def get_calendar_events(self, date: datetime) -> List[Dict]:
        """
        Fetch high impact events for a given date.
        Mock implementation: Returns events if the date matches specific conditions.
        """
        events = []
        
        # Simulate NFP (First Friday of month) - Simplified check
        if date.day <= 7 and date.weekday() == 4:
            events.append({
                "title": "Non-Farm Payrolls (NFP)",
                "impact": "High",
                "time": "13:30",
                "currency": "USD"
            })
            
        # Simulate FOMC (Randomly on Wednesdays)
        if date.weekday() == 2 and random.random() < 0.3:
            events.append({
                "title": "FOMC Meeting Minutes",
                "impact": "High",
                "time": "19:00",
                "currency": "USD"
            })
            
        # General fake events for demo purposes
        if random.random() < 0.2:
            events.append({
                "title": "CPI Data Release",
                "impact": "High",
                "time": "13:30",
                "currency": "USD"
            })
            
        return events

    def check_event_trading_risk(self, trade_time: datetime) -> Optional[Dict]:
        """
        Check if a trade was taken too close to a high impact event.
        Returns a risk dictionary if detected.
        """
        # In a real app, we would query the calendar for the specific date.
        # Here we mock it based on time of day.
        
        # Check if trade is within 15 mins of a "risky hour" :30 mark (common for US news)
        # e.g. 13:30, 14:30
        
        minute = trade_time.minute
        hour = trade_time.hour
        
        is_news_time = False
        event_name = "Unknown Event"
        
        # Classic US News times: 13:30 UTC
        if hour == 13 and 25 <= minute <= 35:
            is_news_time = True
            event_name = "US High Impact Data (CPI/NFP/PPI)"
            
        # FOMC: 19:00 UTC
        if hour == 19 and 0 <= minute <= 10:
            is_news_time = True
            event_name = "FOMC / Fed Interest Rate Decision"
            
        if is_news_time:
            return {
                "name": "Event Trading Risk",
                "severity": 80, # High risk
                "description": f"Trade executed near {event_name}. Market volatility is unpredictable.",
                "details": {
                    "event": event_name,
                    "trade_time": trade_time.strftime("%H:%M")
                }
            }
            
        return None
