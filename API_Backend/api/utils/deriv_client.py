"""
Deriv WebSocket API Client
"""
import asyncio
import json
import websockets
from datetime import datetime
from typing import List, Dict, Any, Optional

class DerivAPIClient:
    """
    Async Client for interacting with Deriv WebSocket API
    Reference: https://api.deriv.com/
    """
    
    def __init__(self, api_token: str, app_id: str = "1089", account_id: Optional[str] = None):
        self.api_token = api_token
        self.app_id = app_id
        self.account_id = account_id
        # Production WebSocket URL
        self.websocket_url = f"wss://ws.binaryws.com/websockets/v3?app_id={app_id}"
    
    async def _call_api(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generic method to send a request and wait for a response.
        Note: This is a simplified one-shot connection. For streaming, we'd keep the socket open.
        """
        try:
            async with websockets.connect(self.websocket_url) as websocket:
                # 1. Send Request
                await websocket.send(json.dumps(request))
                
                # 2. Await Response
                response = await websocket.recv()
                data = json.loads(response)
                
                if "error" in data:
                    print(f"Deriv API Error ({request.get('req_id')}): {data['error']['message']}")
                    return {"success": False, "error": data['error']['message'], "code": data['error']['code']}
                
                return {"success": True, "data": data}
                
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def test_connection(self) -> Dict[str, Any]:
        """Test API connection and Authorize to get account info"""
        try:
            # We must AUTHORIZE to test if the token is valid
            print(f"DEBUG: Testing connection with token length: {len(self.api_token)}")
            print(f"DEBUG: Token prefix: {self.api_token[:4]}...")
            
            request = {
                "authorize": self.api_token,
                "req_id": 1
            }
            
            result = await self._call_api(request)
            
            if not result.get("success"):
                err_msg = result.get("error", "Unknown error")
                debug_info = f"TokenLen={len(self.api_token)} Type={type(self.api_token).__name__} ValErr={err_msg}"
                print(f"DEBUG: {debug_info}")
                # Return this debug info so user can see it
                return {"success": False, "error": debug_info}
            
            # Extract relevant account info
            auth_data = result["data"].get("authorize", {})
            account_info = {
                "loginid": auth_data.get("loginid"),
                "fullname": auth_data.get("fullname"),
                "currency": auth_data.get("currency"),
                "balance": auth_data.get("balance"),
                "is_virtual": auth_data.get("is_virtual") == 1
            }
            
            # Get MT5 accounts
            mt5_accounts = await self.get_mt5_accounts(request["authorize"])
            
            return {
                "success": True,
                "account_info": account_info,
                "mt5_accounts": mt5_accounts,
                "message": "Connected successfully"
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def get_mt5_accounts(self, token: str) -> List[Dict[str, Any]]:
        """Fetch list of MT5 accounts linked to this Deriv account"""
        try:
             # We need a new connection or reuse one, but for simplicity via _call_api which creates one:
             # Wait, _call_api connects fresh. We need to AUTH first.
             # So let's do it cleanly here.
            async with websockets.connect(self.websocket_url) as websocket:
                await websocket.send(json.dumps({"authorize": token}))
                auth_res = json.loads(await websocket.recv())
                
                if "error" in auth_res:
                    print(f"MT5 List Auth Error: {auth_res['error']['message']}")
                    return []
                
                # Request MT5 accounts
                await websocket.send(json.dumps({"mt5_login_list": 1}))
                res_str = await websocket.recv()
                res = json.loads(res_str)
                
                if "error" in res:
                    print(f"MT5 List Fetch Error: {res['error']['message']}")
                    return []
                
                accounts = res.get("mt5_login_list", [])
                
                # Transform/Filter if needed
                result = []
                for acc in accounts:
                    result.append({
                        "login": acc.get("login"),
                        "group": acc.get("group"),
                        "balance": acc.get("balance"),
                        "currency": acc.get("currency"),
                        "leverage": acc.get("leverage"),
                        "name": acc.get("name") # Sometimes available
                    })
                return result
                
        except Exception as e:
            print(f"MT5 Account Fetch Error: {e}")
            return []

    async def get_trades(self, days_back: int = 30) -> List[Dict[str, Any]]:
        """
        Get closed trades using the 'profit_table' endpoint.
        """
        try:
            # 1. Authorize First (Required for private data)
            async with websockets.connect(self.websocket_url) as websocket:
                # Auth
                await websocket.send(json.dumps({"authorize": self.api_token}))
                auth_res = json.loads(await websocket.recv())
                
                if "error" in auth_res:
                    raise Exception(f"Auth failed: {auth_res['error']['message']}")
                
                # 2. Fetch Profit Table
                # limit=3000 is a safe upper bound; for full history ensure paging if needed.
                # date_from is "Epoch value of the starting date of the search."
                date_from = int((datetime.now().timestamp()) - (days_back * 86400))
                
                req = {
                    "profit_table": 1,
                    "description": 1, 
                    "limit": 100, # Start small for safety, or increase
                    "date_from": date_from,
                    "sort": "DESC" # Newest first
                }
                
                await websocket.send(json.dumps(req))
                res_str = await websocket.recv()
                res = json.loads(res_str)
                
                if "error" in res:
                    raise Exception(f"Fetch failed: {res['error']['message']}")
                
                transactions = res.get("profit_table", {}).get("transactions", [])
                
                # 3. Transform basic ProfitTable data to our schema
                trades = []
                for tx in transactions:
                    trade = self.transform_transaction_to_trade(tx)
                    if trade:
                        trades.append(trade)
                
                return trades

        except Exception as e:
            print(f"Detail Fetch Error: {e}")
            return []

    def transform_transaction_to_trade(self, tx: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Transform Deriv 'profit_table' transaction to internal Trade format.
        """
        try:
            # Example tx:
            # {
            #   "contract_id": 12345,
            #   "transaction_id": 67890,
            #   "purchase_time": 1600000000,
            #   "sell_time": 1600000500,
            #   "buy_price": 10.0,
            #   "sell_price": 15.0,
            #   "sell_price": 15.0, # wait, this is 'payout' effectively users call it
            #   "profit": 5.0, # net
            #   "shortcode": "CALL_R_100_...",
            #   "display_name": "Volatility 100 (1s) Index"
            # }
            
            return {
                "deriv_trade_id": str(tx.get("transaction_id")),
                "transaction_id": str(tx.get("transaction_id")),
                "contract_id": str(tx.get("contract_id")),
                "symbol": self._parse_symbol(tx.get("display_name"), tx.get("shortcode")),
                "contract_type": tx.get("shortcode", "").split("_")[0] if tx.get("shortcode") else "UNKNOWN",
                "currency": "USD", # Usually implicit or part of auth; assume USD or modify to fetch from account
                
                # Prices
                "buy_price": float(tx.get("buy_price", 0)), # This is the STAKE
                "sell_price": float(tx.get("sell_price", 0)), # This is the PAYOUT if won? Or just sell value?
                "stake": float(tx.get("buy_price", 0)), # Stake is the buy price for options
                
                # PnL
                "profit": float(tx.get("profit", 0) or 0), # Does not include stake usually? Wait, profit_table 'sell_time' usually implies net result. 
                # Profit in profit_table IS realized profit/loss.
                
                # Timestamps
                "purchase_time": datetime.fromtimestamp(tx.get("purchase_time", 0)),
                "sell_time": datetime.fromtimestamp(tx.get("sell_time", 0)),
                "entry_time": datetime.fromtimestamp(tx.get("purchase_time", 0)), # Normalized
                "exit_time": datetime.fromtimestamp(tx.get("sell_time", 0)),     # Normalized
                
                "status": "won" if float(tx.get("profit", 0) or 0) >= 0 else "lost",
                "raw_data": tx
            }
        except Exception as e:
             # print(f"Transformation Error: {e}")
             return None

    def _parse_symbol(self, display_name, shortcode):
        """Attempts to return a clean symbol like 'R_100' or 'EURUSD'"""
        # Shortcode ex: CALL_R_100_10_... -> R_100 is inside
        # Display Name ex: Bear Market Index
        # Return display name if nice, else first part of shortcode?
        # Actually standard practice: usage of shortcodes parts.
        if shortcode:
            parts = shortcode.split("_")
            if len(parts) > 1:
                return f"{parts[1]}_{parts[2]}" # e.g. R_100, Frx_EURUSD
        return display_name or "Unknown"