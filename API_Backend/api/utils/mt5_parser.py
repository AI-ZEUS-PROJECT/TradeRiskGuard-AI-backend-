import pandas as pd
from bs4 import BeautifulSoup
import io
from datetime import datetime
import re

def parse_mt5_html(content_bytes: bytes) -> pd.DataFrame:
    """
    Parses an MT5 Account History HTML Report into a DataFrame 
    compatible with the TradeRiskGuard analysis engine.
    """
    
    # Check if report contains specific MT5 markers
    soup = BeautifulSoup(content_bytes, 'html.parser')
    
    # Strategy: Find all tables, look for one with "Profit" and "Time" header
    tables = soup.find_all('table')
    target_table = None
    header_row = None
    
    for table in tables:
        rows = table.find_all('tr')
        if not rows:
            continue
            
        # Check first few rows for headers
        for r in rows[:5]:
            cells = [c.get_text(strip=True) for c in r.find_all(['th', 'td'])]
            # Common headers in MT5 History
            if "Time" in cells and "Profit" in cells and ("Symbol" in cells or "Item" in cells):
                target_table = table
                header_row = cells
                break
        if target_table:
            break
            
    if not target_table:
        try:
           # Fallback: Maybe it's a simple Strategy Report with "Trades" table
           # Look for "Profit" column
           for table in tables:
               if "Profit" in table.get_text():
                   target_table = table
                   # Try to infer header
                   header_row = [c.get_text(strip=True) for c in table.find_all('tr')[0].find_all(['th', 'td'])]
                   break
        except:
            pass

    if not target_table or not header_row:
        raise ValueError("Could not identify MT5 History Table in HTML")

    # Normalize headers
    headers = [h.strip() for h in header_row]
    
    data = []
    
    # Parse rows
    rows = target_table.find_all('tr')
    
    # Skip header
    start_idx = 0
    for i, r in enumerate(rows):
        if r.find_all(['th']):
            start_idx = i + 1
            break
            
    for row in rows[start_idx:]:
        cells = [c.get_text(strip=True) for c in row.find_all('td')]
        if not cells or len(cells) < len(headers):
            continue
            
        row_dict = dict(zip(headers, cells))
        
        try:
            # Check if this row is a trade (Profit column non-empty and parsable)
            if "Profit" not in row_dict or not row_dict["Profit"]:
                continue
                
            profit_str = row_dict["Profit"].replace(' ', '').replace(',', '')
            try:
                profit = float(profit_str)
            except:
                continue 
            
            # Map columns
            entry_time = row_dict.get("Open Time") or row_dict.get("Time") # Deal time
            symbol = row_dict.get("Item") or row_dict.get("Symbol")
            trade_type = row_dict.get("Type")
            size = row_dict.get("Size") or row_dict.get("Volume")
            
            if not symbol or not trade_type:
                continue

            # Skip non-trade rows (Balance details)
            if trade_type in ["Balance", "Credit"]:
                continue

            # Create standardized dict
            trade = {
                "ticket": row_dict.get("Ticket") or row_dict.get("Deal"),
                "symbol": symbol,
                "trade_type": trade_type, # Buy/Sell
                "lot_size": float(size) if size else 0,
                "profit_loss": profit,
                "entry_time": pd.to_datetime(entry_time, errors='coerce'),
                "exit_time": pd.to_datetime(row_dict.get("Close Time") or entry_time, errors='coerce'), 
                "entry_price": float(row_dict.get("Price") or row_dict.get("Open Price") or 0),
                "exit_price": float(row_dict.get("Close Price") or row_dict.get("Price") or 0),
                "commission": float(row_dict.get("Commission") or 0),
                "swap": float(row_dict.get("Swap") or 0),
            }
            
            # Fill missing exit time if needed (assume instant exit/entry matches for summary if missing)
            if pd.isna(trade["exit_time"]):
                trade["exit_time"] = trade["entry_time"]
                
            data.append(trade)
            
        except Exception as e:
            continue

    if not data:
        raise ValueError("No valid trades found in MT5 HTML")

    df = pd.DataFrame(data)
    
    # Standardize columns for Analyzer
    # Analyzer expects: trade_id, profit_loss, lot_size, entry_time, exit_time
    df.rename(columns={
        "ticket": "trade_id"
    }, inplace=True)
    
    return df
