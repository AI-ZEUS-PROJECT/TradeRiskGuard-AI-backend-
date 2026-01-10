"""
API endpoints for predictive alerts
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_, or_, func
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any

from api import schemas
from api.database import get_db
from api.auth import get_current_active_user
from api.modelss.alert_models import PredictiveAlert, AlertSettings, AlertHistory
from api.models import User, Analysis
from api.utils.prediction_engine import PredictionEngine
from api.schemass.alerts import (
    GenerateAlertsRequest, AlertResponse, GenerateAlertsResponse,
    AcknowledgeAlertRequest, SnoozeAlertRequest, AlertSettingsUpdate,
    AlertSettingsResponse, UserAlertsResponse, AlertStats
)

router = APIRouter()

# Helper functions
def get_or_create_alert_settings(db: Session, user_id: str) -> AlertSettings:
    """Get or create alert settings for user"""
    settings = db.query(AlertSettings).filter(AlertSettings.user_id == user_id).first()
    if not settings:
        settings = AlertSettings(user_id=user_id)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

def create_alert_history(db: Session, alert_id: str, user_id: str, action: str, details: Dict = None):
    """Create alert history entry"""
    history = AlertHistory(
        alert_id=alert_id,
        user_id=user_id,
        action=action,
        action_details=details
    )
    db.add(history)
    db.commit()

def calculate_alert_stats(db: Session, user_id: str) -> AlertStats:
    """Calculate alert statistics for user"""
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Total active alerts (not acknowledged or expired)
    active_alerts = db.query(PredictiveAlert).filter(
        PredictiveAlert.user_id == user_id,
        PredictiveAlert.status.in_(["active", "snoozed"]),
        or_(
            PredictiveAlert.expires_at.is_(None),
            PredictiveAlert.expires_at > now
        )
    ).count()
    
    # High priority alerts (high or critical severity)
    high_priority = db.query(PredictiveAlert).filter(
        PredictiveAlert.user_id == user_id,
        PredictiveAlert.severity.in_(["high", "critical"]),
        PredictiveAlert.status.in_(["active", "snoozed"]),
        or_(
            PredictiveAlert.expires_at.is_(None),
            PredictiveAlert.expires_at > now
        )
    ).count()
    
    # Unacknowledged alerts
    unacknowledged = db.query(PredictiveAlert).filter(
        PredictiveAlert.user_id == user_id,
        PredictiveAlert.status == "active",
        or_(
            PredictiveAlert.expires_at.is_(None),
            PredictiveAlert.expires_at > now
        )
    ).count()
    
    # Today's generated alerts
    today_generated = db.query(PredictiveAlert).filter(
        PredictiveAlert.user_id == user_id,
        PredictiveAlert.created_at >= today_start
    ).count()
    
    # Today's acknowledged alerts
    acknowledged_today = db.query(PredictiveAlert).filter(
        PredictiveAlert.user_id == user_id,
        PredictiveAlert.acknowledged_at >= today_start
    ).count()
    
    return AlertStats(
        active=active_alerts,
        high_priority=high_priority,
        unacknowledged=unacknowledged,
        today_generated=today_generated,
        acknowledged_today=acknowledged_today
    )

# API Endpoints
@router.post("/predictive", response_model=schemas.APIResponse)
async def generate_predictive_alerts(
    request: GenerateAlertsRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Generate predictive alerts based on user's trading patterns
    """
    try:
        # Check if user has settings
        settings = get_or_create_alert_settings(db, current_user.id)
        if not settings.enabled:
            return schemas.APIResponse.success_response(
                message="Alerts are disabled in settings",
                data={"alerts": []}
            )
        
        # Get latest analysis or specific analysis
        if request.analysis_id:
            analysis = db.query(Analysis).filter(
                Analysis.id == request.analysis_id,
                Analysis.user_id == current_user.id
            ).first()
            if not analysis:
                raise HTTPException(
                    status_code=404,
                    detail="Analysis not found"
                )
        else:
            # Get latest analysis
            analysis = db.query(Analysis).filter(
                Analysis.user_id == current_user.id
            ).order_by(desc(Analysis.created_at)).first()
        
        if not analysis:
            raise HTTPException(
                status_code=400,
                detail="No analysis found. Please analyze trades first."
            )
        
        # Check if we should regenerate (if force or no recent alerts)
        if not request.force_regenerate:
            recent_alerts = db.query(PredictiveAlert).filter(
                PredictiveAlert.user_id == current_user.id,
                PredictiveAlert.analysis_id == analysis.id,
                PredictiveAlert.created_at >= datetime.utcnow() - timedelta(hours=24)
            ).first()
            
            if recent_alerts:
                # Return existing recent alerts
                alerts = db.query(PredictiveAlert).filter(
                    PredictiveAlert.user_id == current_user.id,
                    PredictiveAlert.analysis_id == analysis.id,
                    PredictiveAlert.created_at >= datetime.utcnow() - timedelta(hours=24)
                ).all()
                
                return schemas.APIResponse.success_response(
                    data={
                        "alerts": [alert.to_dict() for alert in alerts],
                        "summary": {
                            "total_alerts": len(alerts),
                            "active_alerts": sum(1 for a in alerts if a.is_active()),
                            "high_priority_alerts": sum(1 for a in alerts if a.severity in ["high", "critical"]),
                            "unacknowledged_alerts": sum(1 for a in alerts if a.status == "active"),
                            "by_type": {},
                            "by_severity": {}
                        },
                        "generated_at": datetime.utcnow()
                    },
                    message="Using recent alerts (generated within 24 hours)"
                )
        
        # Generate new alerts
        # TODO: We need trades data - for now, use metrics from analysis
        # In future, we'll need to store trades separately
        
        # Create prediction engine with available data
        prediction_engine = PredictionEngine(
            metrics=analysis.metrics or {},
            trades_data=[],  # Empty for now - we need to store trades
            risk_results=analysis.risk_results or {}
        )
        
        # Generate alerts
        raw_alerts = prediction_engine.generate_all_alerts(request.timeframe)
        
        # Filter by user settings
        filtered_alerts = []
        for alert in raw_alerts:
            # Check confidence threshold
            if alert["confidence"] < settings.min_confidence:
                continue
            
            # Check alert type preferences
            alert_type = alert["alert_type"]
            if alert_type == "pattern" and not settings.show_pattern_alerts:
                continue
            elif alert_type == "behavioral" and not settings.show_behavioral_alerts:
                continue
            elif alert_type == "time_based" and not settings.show_time_based_alerts:
                continue
            elif alert_type == "market" and not settings.show_market_alerts:
                continue
            
            filtered_alerts.append(alert)
        
        # Save alerts to database
        saved_alerts = []
        for alert_data in filtered_alerts:
            # Calculate expiration (7 days for most alerts, 1 day for next_trade)
            expires_at = None
            if alert_data["timeframe"] == "next_trade":
                expires_at = datetime.utcnow() + timedelta(days=1)
            else:
                expires_at = datetime.utcnow() + timedelta(days=7)
            
            alert = PredictiveAlert(
                user_id=current_user.id,
                analysis_id=analysis.id,
                alert_type=alert_data["alert_type"],
                severity=alert_data["severity"],
                title=alert_data["title"],
                description=alert_data["description"],
                confidence=alert_data["confidence"],
                timeframe=alert_data["timeframe"],
                prediction_data=alert_data.get("trigger_conditions", {}),
                trigger_conditions=alert_data.get("trigger_conditions", {}),
                suggested_actions=alert_data.get("suggested_actions", []),
                expires_at=expires_at
            )
            
            db.add(alert)
            saved_alerts.append(alert)
            
            # Create history entry
            create_alert_history(
                db=db,
                alert_id=alert.id,
                user_id=current_user.id,
                action="created",
                details={"source": "prediction_engine"}
            )
        
        db.commit()
        
        # Refresh to get IDs
        for alert in saved_alerts:
            db.refresh(alert)
        
        # Calculate summary
        alert_summary = {
            "total_alerts": len(saved_alerts),
            "active_alerts": len(saved_alerts),  # All new alerts are active
            "high_priority_alerts": sum(1 for a in saved_alerts if a.severity in ["high", "critical"]),
            "unacknowledged_alerts": len(saved_alerts),
            "by_type": {},
            "by_severity": {}
        }
        
        # Count by type and severity
        for alert in saved_alerts:
            alert_summary["by_type"][alert.alert_type] = alert_summary["by_type"].get(alert.alert_type, 0) + 1
            alert_summary["by_severity"][alert.severity] = alert_summary["by_severity"].get(alert.severity, 0) + 1
        
        response_data = {
            "alerts": [alert.to_dict() for alert in saved_alerts],
            "summary": alert_summary,
            "generated_at": datetime.utcnow()
        }
        
        return schemas.APIResponse.success_response(
            data=response_data,
            message=f"Generated {len(saved_alerts)} predictive alerts"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating alerts: {str(e)}"
        )

@router.get("/user", response_model=schemas.APIResponse)
async def get_user_alerts(
    status: Optional[str] = Query(None, regex="^(active|snoozed|acknowledged|expired|all)$"),
    severity: Optional[str] = Query(None, regex="^(low|medium|high|critical)$"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get alerts for the current user with filtering options
    """
    try:
        # Base query
        query = db.query(PredictiveAlert).filter(
            PredictiveAlert.user_id == current_user.id
        )
        
        # Apply status filter
        if status and status != "all":
            if status == "active":
                # Active includes non-expired active or snoozed alerts
                now = datetime.utcnow()
                query = query.filter(
                    PredictiveAlert.status.in_(["active", "snoozed"]),
                    or_(
                        PredictiveAlert.expires_at.is_(None),
                        PredictiveAlert.expires_at > now
                    )
                )
            else:
                query = query.filter(PredictiveAlert.status == status)
        
        # Apply severity filter
        if severity:
            query = query.filter(PredictiveAlert.severity == severity)
        
        # Order by creation date (newest first)
        query = query.order_by(desc(PredictiveAlert.created_at))
        
        # Get total count before pagination
        total_count = query.count()
        
        # Apply pagination
        alerts = query.offset(offset).limit(limit).all()
        
        # Calculate stats
        stats = calculate_alert_stats(db, current_user.id)
        
        # Prepare response
        response_data = {
            "alerts": [alert.to_dict() for alert in alerts],
            "stats": stats,
            "pagination": {
                "total": total_count,
                "limit": limit,
                "offset": offset,
                "has_more": (offset + limit) < total_count
            }
        }
        
        return schemas.APIResponse.success_response(data=response_data)
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching alerts: {str(e)}"
        )

@router.post("/{alert_id}/acknowledge", response_model=schemas.APIResponse)
async def acknowledge_alert(
    alert_id: str,
    request: AcknowledgeAlertRequest = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Acknowledge an alert
    """
    try:
        alert = db.query(PredictiveAlert).filter(
            PredictiveAlert.id == alert_id,
            PredictiveAlert.user_id == current_user.id
        ).first()
        
        if not alert:
            raise HTTPException(
                status_code=404,
                detail="Alert not found"
            )
        
        # Update alert
        alert.status = "acknowledged"
        alert.acknowledged_at = datetime.utcnow()
        
        # Create history entry
        create_alert_history(
            db=db,
            alert_id=alert.id,
            user_id=current_user.id,
            action="acknowledged",
            details={"notes": request.notes if request else None}
        )
        
        db.commit()
        
        return schemas.APIResponse.success_response(
            data=alert.to_dict(),
            message="Alert acknowledged"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error acknowledging alert: {str(e)}"
        )

@router.post("/{alert_id}/snooze", response_model=schemas.APIResponse)
async def snooze_alert(
    alert_id: str,
    request: SnoozeAlertRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Snooze an alert for specified duration
    """
    try:
        alert = db.query(PredictiveAlert).filter(
            PredictiveAlert.id == alert_id,
            PredictiveAlert.user_id == current_user.id
        ).first()
        
        if not alert:
            raise HTTPException(
                status_code=404,
                detail="Alert not found"
            )
        
        # Calculate snooze until time
        snooze_until = datetime.utcnow() + timedelta(hours=request.duration_hours)
        
        # Update alert
        alert.status = "snoozed"
        alert.snoozed_until = snooze_until
        
        # Create history entry
        create_alert_history(
            db=db,
            alert_id=alert.id,
            user_id=current_user.id,
            action="snoozed",
            details={
                "duration_hours": request.duration_hours,
                "reason": request.reason,
                "snoozed_until": snooze_until.isoformat()
            }
        )
        
        db.commit()
        
        return schemas.APIResponse.success_response(
            data=alert.to_dict(),
            message=f"Alert snoozed for {request.duration_hours} hours"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error snoozing alert: {str(e)}"
        )

@router.get("/settings", response_model=schemas.APIResponse)
async def get_alert_settings(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get alert settings for current user
    """
    try:
        settings = get_or_create_alert_settings(db, current_user.id)
        
        response_data = AlertSettingsResponse(
            user_id=settings.user_id,
            enabled=settings.enabled,
            min_confidence=settings.min_confidence,
            in_app_alerts=settings.in_app_alerts,
            email_alerts=settings.email_alerts,
            push_notifications=settings.push_notifications,
            show_pattern_alerts=settings.show_pattern_alerts,
            show_behavioral_alerts=settings.show_behavioral_alerts,
            show_time_based_alerts=settings.show_time_based_alerts,
            show_market_alerts=settings.show_market_alerts,
            real_time_alerts=settings.real_time_alerts,
            daily_summary=settings.daily_summary,
            weekly_report=settings.weekly_report,
            default_snooze_hours=settings.default_snooze_hours,
            created_at=settings.created_at,
            updated_at=settings.updated_at
        )
        
        return schemas.APIResponse.success_response(data=response_data)
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching alert settings: {str(e)}"
        )

@router.put("/settings", response_model=schemas.APIResponse)
async def update_alert_settings(
    settings_update: AlertSettingsUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update alert settings for current user
    """
    try:
        settings = get_or_create_alert_settings(db, current_user.id)
        
        # Update only provided fields
        update_data = settings_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(settings, field, value)
        
        settings.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(settings)
        
        response_data = AlertSettingsResponse(
            user_id=settings.user_id,
            enabled=settings.enabled,
            min_confidence=settings.min_confidence,
            in_app_alerts=settings.in_app_alerts,
            email_alerts=settings.email_alerts,
            push_notifications=settings.push_notifications,
            show_pattern_alerts=settings.show_pattern_alerts,
            show_behavioral_alerts=settings.show_behavioral_alerts,
            show_time_based_alerts=settings.show_time_based_alerts,
            show_market_alerts=settings.show_market_alerts,
            real_time_alerts=settings.real_time_alerts,
            daily_summary=settings.daily_summary,
            weekly_report=settings.weekly_report,
            default_snooze_hours=settings.default_snooze_hours,
            created_at=settings.created_at,
            updated_at=settings.updated_at
        )
        
        return schemas.APIResponse.success_response(
            data=response_data,
            message="Alert settings updated successfully"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating alert settings: {str(e)}"
        )

@router.get("/stats", response_model=schemas.APIResponse)
async def get_alert_statistics(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get alert statistics for current user
    """
    try:
        stats = calculate_alert_stats(db, current_user.id)
        
        # Additional stats
        now = datetime.utcnow()
        thirty_days_ago = now - timedelta(days=30)
        
        # Alerts generated in last 30 days
        recent_alerts = db.query(PredictiveAlert).filter(
            PredictiveAlert.user_id == current_user.id,
            PredictiveAlert.created_at >= thirty_days_ago
        ).count()
        
        # Most common alert type
        common_type = db.query(
            PredictiveAlert.alert_type,
            func.count(PredictiveAlert.id).label('count')
        ).filter(
            PredictiveAlert.user_id == current_user.id,
            PredictiveAlert.created_at >= thirty_days_ago
        ).group_by(PredictiveAlert.alert_type).order_by(func.count(PredictiveAlert.id).desc()).first()
        
        response_data = {
            "current": stats,
            "historical": {
                "alerts_last_30_days": recent_alerts,
                "most_common_alert_type": common_type[0] if common_type else None,
                "common_type_count": common_type[1] if common_type else 0
            }
        }
        
        return schemas.APIResponse.success_response(data=response_data)
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching alert statistics: {str(e)}"
        )

@router.delete("/{alert_id}", response_model=schemas.APIResponse)
async def delete_alert(
    alert_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Delete an alert (soft delete by marking as expired)
    """
    try:
        alert = db.query(PredictiveAlert).filter(
            PredictiveAlert.id == alert_id,
            PredictiveAlert.user_id == current_user.id
        ).first()
        
        if not alert:
            raise HTTPException(
                status_code=404,
                detail="Alert not found"
            )
        
        # Soft delete by marking as expired
        alert.status = "expired"
        
        # Create history entry
        create_alert_history(
            db=db,
            alert_id=alert.id,
            user_id=current_user.id,
            action="expired",
            details={"source": "user_deleted"}
        )
        
        db.commit()
        
        return schemas.APIResponse.success_response(
            message="Alert deleted successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting alert: {str(e)}"
        )