import sqlite3
import os
import sys

def apply_migrations():
    """
    Apply missing database columns to the SQLite database.
    This is necessary because SQLAlchemy's create_all() does not update existing tables.
    """
    database_url = os.getenv("DATABASE_URL", "sqlite:///./tradeguard.db")
    
    # Extract file path from sqlite:///./tradeguard.db
    if not database_url.startswith("sqlite:///"):
        print(f"Migration skipped: Only SQLite is supported by this script currently. URL: {database_url}")
        return

    db_path = database_url.replace("sqlite:///", "")
    
    if not os.path.exists(db_path):
        print(f"Migration skipped: Database file not found at {db_path}")
        return

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if user_settings table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='user_settings'")
        if not cursor.fetchone():
            print("Migration skipped: user_settings table does not exist yet.")
            conn.close()
            return

        # Get existing columns in user_settings
        cursor.execute("PRAGMA table_info(user_settings)")
        columns = [row[1] for row in cursor.fetchall()]

        # Columns to add if missing
        missing_columns = [
            ("openai_api_key_encrypted", "TEXT")
        ]

        for col_name, col_type in missing_columns:
            if col_name not in columns:
                print(f"🔧 Adding missing column '{col_name}' to 'user_settings' table...")
                cursor.execute(f"ALTER TABLE user_settings ADD COLUMN {col_name} {col_type}")
                print(f"✅ Column '{col_name}' added successfully.")
            else:
                print(f"ℹ️ Column '{col_name}' already exists in 'user_settings'.")

        conn.commit()
        conn.close()
        print("✅ Database migrations completed.")
        
    except Exception as e:
        print(f"❌ Error applying migrations: {e}")

if __name__ == "__main__":
    apply_migrations()
