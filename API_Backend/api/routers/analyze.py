"""
API endpoints for trade analysis
"""
import pandas as pd
import io
import json
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import Optional, List
import tempfile
import os
from datetime import datetime

from api import schemas, models, auth
from api.database import get_db
from core.metrics_calculator import TradeMetricsCalculator
from core.risk_rules import RiskRuleEngine
from core.risk_scorer import RiskScorer
from core.ai_explainer import AIRiskExplainer

router = APIRouter()

# Helper function to process CSV data
def process_trade_data(df: pd.DataFrame):
    """Process trade data and return analysis results"""
    # Calculate metrics
    calculator = TradeMetricsCalculator(df)
    metrics = calculator.compute_all_metrics()
    
    # Detect risks
    risk_engine = RiskRuleEngine(metrics, df)
    risk_results = risk_engine.detect_all_risks()
    
    # Calculate score
    scorer = RiskScorer()
    score_result = scorer.calculate_score(risk_results['risk_details'])
    
    # Generate AI explanations
    ai_explainer = AIRiskExplainer()
    ai_explanations = ai_explainer.generate_explanation(
        metrics, 
        risk_results, 
        score_result
    )
    
    return {
        "metrics": metrics,
        "risk_results": risk_results,
        "score_result": score_result,
        "ai_explanations": ai_explanations
    }

def save_analysis_to_db(
    db: Session,
    user: Optional[models.User],
    filename: str,
    original_filename: str,
    file_size: int,
    trade_count: int,
    results: dict
):
    """Save analysis results to database"""
    analysis = models.Analysis(
        user_id=user.id if user else None,
        filename=filename,
        original_filename=original_filename,
        file_size=file_size,
        trade_count=trade_count,
        metrics=results.get("metrics"),
        risk_results=results.get("risk_results"),
        score_result=results.get("score_result"),
        ai_explanations=results.get("ai_explanations"),
        status="completed",
        completed_at=datetime.utcnow()
    )
    
    db.add(analysis)
    db.commit()
    db.refresh(analysis)
    return analysis

@router.post("/trades", response_model=schemas.APIResponse)
async def analyze_trades(
    file: Optional[UploadFile] = File(None),
    use_sample: bool = False,
    background_tasks: BackgroundTasks = None,
    current_user: Optional[schemas.UserResponse] = Depends(auth.get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Analyze trading data from uploaded CSV file or use sample data
    """
    try:
        if use_sample:
            # Use sample data
            sample_data = {
                'trade_id': [1, 2, 3, 4],
                'profit_loss': [50, -30, 75, -20],
                'lot_size': [0.1, 0.2, 0.15, 0.1],
                'account_balance_before': [10000, 10050, 10020, 10095],
                'stop_loss': [1.1, 1.2, 1.15, 1.3],
                'entry_time': ['2024-01-01 10:00:00', '2024-01-01 11:00:00', 
                              '2024-01-01 12:00:00', '2024-01-01 12:15:00'],
                'exit_time': ['2024-01-01 11:00:00', '2024-01-01 11:30:00',
                             '2024-01-01 13:00:00', '2024-01-01 12:45:00']
            }
            df = pd.DataFrame(sample_data)
            filename = "sample_data.csv"
            original_filename = "sample_data.csv"
            file_size = 1024  # Approximate size
            trade_count = len(df)
        else:
            if not file:
                raise HTTPException(
                    status_code=400,
                    detail="No file uploaded. Either upload a file or set use_sample=true"
                )
            
            # Validate file type
            if not file.filename.endswith('.csv'):
                raise HTTPException(
                    status_code=400,
                    detail="Only CSV files are supported"
                )
            
            # Read CSV file
            contents = await file.read()
            try:
                df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
            except Exception as e:
                raise HTTPException(
                    status_code=400,
                    detail=f"Error reading CSV file: {str(e)}"
                )
            
            filename = file.filename
            original_filename = file.filename
            file_size = len(contents)
            trade_count = len(df)
        
        # Process the data
        results = process_trade_data(df)
        
        # Save to database if user is authenticated
        analysis = None
        if current_user or True:  # Always save for now, can make optional
            analysis = save_analysis_to_db(
                db=db,
                user=current_user,
                filename=filename,
                original_filename=original_filename,
                file_size=file_size,
                trade_count=trade_count,
                results=results
            )
        
        # Prepare response
        response_data = {
            "analysis_id": analysis.id if analysis else None,
            **results
        }
        
        return schemas.APIResponse.success_response(
            data=response_data,
            message="Analysis completed successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing analysis: {str(e)}"
        )

@router.get("/{analysis_id}", response_model=schemas.APIResponse)
async def get_analysis(
    analysis_id: str,
    current_user: Optional[schemas.UserResponse] = Depends(auth.get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Get analysis results by ID
    """
    analysis = db.query(models.Analysis).filter(models.Analysis.id == analysis_id).first()
    
    if not analysis:
        raise HTTPException(
            status_code=404,
            detail="Analysis not found"
        )
    
    # Check authorization (users can only access their own analyses)
    if current_user and analysis.user_id and analysis.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to access this analysis"
        )
    
    # Convert to response format
    response_data = {
        "id": analysis.id,
        "status": analysis.status,
        "metrics": analysis.metrics,
        "risk_results": analysis.risk_results,
        "score_result": analysis.score_result,
        "ai_explanations": analysis.ai_explanations,
        "created_at": analysis.created_at,
        "completed_at": analysis.completed_at,
        "filename": analysis.original_filename,
        "trade_count": analysis.trade_count
    }
    
    return schemas.APIResponse.success_response(data=response_data)

@router.get("/", response_model=schemas.APIResponse)
async def list_analyses(
    skip: int = 0,
    limit: int = 20,
    current_user: Optional[schemas.UserResponse] = Depends(auth.get_optional_user),
    db: Session = Depends(get_db)
):
    """
    List analyses for the current user
    """
    if not current_user:
        raise HTTPException(
            status_code=401,
            detail="Authentication required to list analyses"
        )
    
    # Get user's analyses
    analyses = db.query(models.Analysis)\
        .filter(models.Analysis.user_id == current_user.id)\
        .order_by(models.Analysis.created_at.desc())\
        .offset(skip)\
        .limit(limit)\
        .all()
    
    total = db.query(models.Analysis)\
        .filter(models.Analysis.user_id == current_user.id)\
        .count()
    
    response_data = {
        "analyses": [
            {
                "id": a.id,
                "filename": a.original_filename,
                "trade_count": a.trade_count,
                "score": a.score_result.get("score") if a.score_result else None,
                "grade": a.score_result.get("grade") if a.score_result else None,
                "created_at": a.created_at,
                "status": a.status
            }
            for a in analyses
        ],
        "total": total,
        "skip": skip,
        "limit": limit
    }
    
    return schemas.APIResponse.success_response(data=response_data)

@router.post("/quick", response_model=schemas.APIResponse)
async def quick_analyze(
    request: dict,  # Accept raw JSON data
    current_user: Optional[schemas.UserResponse] = Depends(auth.get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Quick analysis from JSON data (for testing or direct API calls)
    """
    try:
        # Convert JSON to DataFrame
        df = pd.DataFrame(request.get("trades", []))
        
        if df.empty:
            raise HTTPException(
                status_code=400,
                detail="No trade data provided"
            )
        
        # Process the data
        results = process_trade_data(df)
        
        # Save to database
        analysis = save_analysis_to_db(
            db=db,
            user=current_user,
            filename="quick_analysis.json",
            original_filename="quick_analysis.json",
            file_size=len(json.dumps(request)),
            trade_count=len(df),
            results=results
        )
        
        response_data = {
            "analysis_id": analysis.id,
            **results
        }
        
        return schemas.APIResponse.success_response(
            data=response_data,
            message="Quick analysis completed successfully"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error in quick analysis: {str(e)}"
        )