"""
Pydantic schemas for predictive alerts
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

# Enums
class AlertType(str, Enum):
    PATTERN = "pattern"
    BEHAVIORAL = "behavioral"
    TIME_BASED = "time_based"
    MARKET = "market"

class AlertSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class AlertStatus(str, Enum):
    ACTIVE = "active"
    SNOOZED = "snoozed"
    ACKNOWLEDGED = "acknowledged"
    EXPIRED = "expired"

class Timeframe(str, Enum):
    NEXT_TRADE = "next_trade"
    NEXT_DAY = "next_day"
    NEXT_WEEK = "next_week"
    NEXT_MONTH = "next_month"

# Request Schemas
class GenerateAlertsRequest(BaseModel):
    analysis_id: Optional[str] = None
    timeframe: Timeframe = Timeframe.NEXT_WEEK
    include_market_data: bool = False
    force_regenerate: bool = False

class AcknowledgeAlertRequest(BaseModel):
    notes: Optional[str] = None

class SnoozeAlertRequest(BaseModel):
    duration_hours: int = Field(24, ge=1, le=168)  # 1 hour to 1 week
    reason: Optional[str] = None

class AlertSettingsUpdate(BaseModel):
    enabled: Optional[bool] = None
    min_confidence: Optional[float] = Field(None, ge=0.0, le=1.0)
    in_app_alerts: Optional[bool] = None
    email_alerts: Optional[bool] = None
    push_notifications: Optional[bool] = None
    show_pattern_alerts: Optional[bool] = None
    show_behavioral_alerts: Optional[bool] = None
    show_time_based_alerts: Optional[bool] = None
    show_market_alerts: Optional[bool] = None
    real_time_alerts: Optional[bool] = None
    daily_summary: Optional[bool] = None
    weekly_report: Optional[bool] = None
    default_snooze_hours: Optional[int] = Field(None, ge=1, le=168)

# Response Schemas
class AlertResponse(BaseModel):
    id: str
    alert_type: str
    severity: str
    title: str
    description: str
    confidence: float
    timeframe: str
    status: str
    is_active: bool
    created_at: datetime
    acknowledged_at: Optional[datetime] = None
    snoozed_until: Optional[datetime] = None
    suggested_actions: List[str] = []
    trigger_conditions: Dict[str, Any] = {}
    
    class Config:
        from_attributes = True

class AlertSummary(BaseModel):
    total_alerts: int
    active_alerts: int
    high_priority_alerts: int
    unacknowledged_alerts: int
    by_type: Dict[str, int]
    by_severity: Dict[str, int]

class GenerateAlertsResponse(BaseModel):
    alerts: List[AlertResponse]
    summary: AlertSummary
    generated_at: datetime

class AlertStats(BaseModel):
    active: int
    high_priority: int
    unacknowledged: int
    today_generated: int
    acknowledged_today: int

class UserAlertsResponse(BaseModel):
    alerts: List[AlertResponse]
    stats: AlertStats
    pagination: Dict[str, Any]

class AlertSettingsResponse(AlertSettingsUpdate):
    user_id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# History Schemas
class AlertHistoryResponse(BaseModel):
    id: str
    alert_id: str
    action: str
    action_details: Optional[Dict[str, Any]] = None
    created_at: datetime
    
    class Config:
        from_attributes = True