import sqlite3
import os

DB_FILE = "tradeguard.db"

def fix_schema():
    if not os.path.exists(DB_FILE):
        print(f"Database file {DB_FILE} not found!")
        return

    print(f"Connecting to {DB_FILE}...")
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    try:
        # Check if column exists
        cursor.execute("PRAGMA table_info(user_settings)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if "openai_api_key_encrypted" in columns:
            print("Column 'openai_api_key_encrypted' already exists in 'user_settings'.")
        else:
            print("Adding 'openai_api_key_encrypted' column to 'user_settings'...")
            cursor.execute("ALTER TABLE user_settings ADD COLUMN openai_api_key_encrypted TEXT")
            conn.commit()
            print("Column added successfully.")
            
    except Exception as e:
        print(f"Error updating schema: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    fix_schema()
