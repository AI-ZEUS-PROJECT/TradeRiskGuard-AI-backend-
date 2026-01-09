"""
Initialize new database tables for alerts while keeping existing tables
"""
import sys
import os
import traceback

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from api.database import engine, Base

# -------------------------------
# Import existing models first
# -------------------------------
# These are your old tables outside the models folder
from api.models import User, Analysis    # Ensure existing models are loaded

# -------------------------------
# Import alert models
# -------------------------------
from api.modelss.alert_models import PredictiveAlert, AlertSettings, AlertHistory

# List of tables in the correct creation order
tables_to_create = [User, Analysis, PredictiveAlert, AlertSettings, AlertHistory]

print("🔧 Creating alert database tables...")
try:
    for model in tables_to_create:
        print(f"➡ Creating table: {model.__tablename__}")
        # Only create if it does not exist
        model.__table__.create(bind=engine, checkfirst=True)

    # Verify tables
    from sqlalchemy import inspect
    inspector = inspect(engine)
    all_tables = inspector.get_table_names()
    print(f"✅ Tables currently in DB: {all_tables}")

except Exception as e:
    print(f"❌ Error adding alert tables: {e}")
    traceback.print_exc()
