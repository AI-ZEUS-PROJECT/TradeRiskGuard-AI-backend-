"""
Database models for predictive alerts
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, Boolean, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from api.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class PredictiveAlert(Base):
    __tablename__ = "predictive_alerts"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    analysis_id = Column(String, ForeignKey("analyses.id"), nullable=True)
    
    # Alert details
    alert_type = Column(String, nullable=False)  # "pattern", "behavioral", "time_based", "market"
    severity = Column(String, nullable=False)    # "low", "medium", "high", "critical"
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    
    # Prediction metrics
    confidence = Column(Float, nullable=False)  # 0.0 to 1.0
    timeframe = Column(String, nullable=False)  # "next_trade", "next_day", "next_week", "next_month"
    
    # Alert data
    prediction_data = Column(JSON, nullable=True)  # Raw prediction data
    trigger_conditions = Column(JSON, nullable=True)  # Conditions that triggered this alert
    suggested_actions = Column(JSON, nullable=True)  # Suggested actions to mitigate risk
    
    # Status
    status = Column(String, default="active")  # "active", "snoozed", "acknowledged", "expired"
    acknowledged_at = Column(DateTime, nullable=True)
    snoozed_until = Column(DateTime, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", backref="alerts")
    analysis = relationship("Analysis", backref="alerts")
    
    def is_active(self):
        if self.status == "expired":
            return False
        if self.snoozed_until and datetime.utcnow() < self.snoozed_until:
            return False
        return self.status == "active"
    
    def to_dict(self):
        return {
            "id": self.id,
            "alert_type": self.alert_type,
            "severity": self.severity,
            "title": self.title,
            "description": self.description,
            "confidence": self.confidence,
            "timeframe": self.timeframe,
            "status": self.status,
            "is_active": self.is_active(),
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "acknowledged_at": self.acknowledged_at.isoformat() if self.acknowledged_at else None,
            "snoozed_until": self.snoozed_until.isoformat() if self.snoozed_until else None,
            "suggested_actions": self.suggested_actions or [],
            "trigger_conditions": self.trigger_conditions or {}
        }

class AlertSettings(Base):
    __tablename__ = "alert_settings"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), unique=True, nullable=False)
    
    # Alert preferences
    enabled = Column(Boolean, default=True)
    min_confidence = Column(Float, default=0.7)  # Minimum confidence to show alert
    
    # Alert channels
    in_app_alerts = Column(Boolean, default=True)
    email_alerts = Column(Boolean, default=False)
    push_notifications = Column(Boolean, default=False)
    
    # Alert types to show
    show_pattern_alerts = Column(Boolean, default=True)
    show_behavioral_alerts = Column(Boolean, default=True)
    show_time_based_alerts = Column(Boolean, default=True)
    show_market_alerts = Column(Boolean, default=False)
    
    # Frequency
    real_time_alerts = Column(Boolean, default=True)
    daily_summary = Column(Boolean, default=True)
    weekly_report = Column(Boolean, default=False)
    
    # Snooze settings
    default_snooze_hours = Column(Integer, default=24)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", backref="alert_settings")
    
    def to_dict(self):
        return {
            "enabled": self.enabled,
            "min_confidence": self.min_confidence,
            "in_app_alerts": self.in_app_alerts,
            "email_alerts": self.email_alerts,
            "push_notifications": self.push_notifications,
            "show_pattern_alerts": self.show_pattern_alerts,
            "show_behavioral_alerts": self.show_behavioral_alerts,
            "show_time_based_alerts": self.show_time_based_alerts,
            "show_market_alerts": self.show_market_alerts,
            "real_time_alerts": self.real_time_alerts,
            "daily_summary": self.daily_summary,
            "weekly_report": self.weekly_report,
            "default_snooze_hours": self.default_snooze_hours,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

class AlertHistory(Base):
    __tablename__ = "alert_history"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    alert_id = Column(String, ForeignKey("predictive_alerts.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    # Action details
    action = Column(String, nullable=False)  # "created", "acknowledged", "snoozed", "expired"
    action_details = Column(JSON, nullable=True)  # Additional details about the action
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    alert = relationship("PredictiveAlert", backref="history")
    user = relationship("User", backref="alert_history")