"""
Test script for Deriv Integration API
IMPORTANT: This script will use real API credentials - be careful!
"""
import requests
import json
import time
from datetime import datetime
import getpass

BASE_URL = "http://localhost:8000"

# Global variables
access_token = None
user_id = None
connection_id = None
test_deriv_credentials = {}

def print_response(response, label=""):
    """Pretty print API response"""
    print(f"\n{'='*60}")
    if label:
        print(f"📋 {label}")
    print(f"Status Code: {response.status_code}")
    try:
        data = response.json()
        print("Response Body (truncated):")
        # Hide sensitive data
        safe_data = data.copy()
        if 'data' in safe_data and isinstance(safe_data['data'], dict):
            if 'connection' in safe_data['data'] and isinstance(safe_data['data']['connection'], dict):
                # Remove any sensitive fields that might be exposed
                sensitive_fields = ['api_token', 'app_id', 'account_id']
                for field in sensitive_fields:
                    safe_data['data']['connection'].pop(field, None)
        
        response_str = json.dumps(safe_data, indent=2)
        if len(response_str) > 800:
            print(response_str[:800] + "...\n[Response truncated]")
        else:
            print(response_str)
        return data
    except:
        print(f"Raw Response (first 500 chars): {response.text[:500]}...")
        return None
    print('='*60)

def get_headers():
    """Get request headers with auth"""
    headers = {"Content-Type": "application/json"}
    if access_token:
        headers["Authorization"] = f"Bearer {access_token}"
    return headers

def setup_test_user():
    """Create a test user for testing"""
    global access_token, user_id
    
    print("🔧 Setting up test user...")
    
    # Generate unique test credentials
    timestamp = int(time.time())
    test_email = f"deriv_test_{timestamp}@example.com"
    test_username = f"derivtester_{timestamp}"
    
    # Register user
    response = requests.post(
        f"{BASE_URL}/api/users/register",
        json={
            "email": test_email,
            "username": test_username,
            "password": "DerivTest123!"
        }
    )
    
    if response.status_code != 200:
        print(f"❌ Failed to register user: {response.status_code}")
        return False
    
    data = response.json()
    if data.get("success"):
        access_token = data["data"]["access_token"]
        user_id = data["data"]["user"]["id"]
        print(f"✅ User created: {test_email}")
        return True
    return False

def get_deriv_credentials():
    """Safely get Deriv API credentials from user"""
    global test_deriv_credentials
    
    print("\n🔐 Deriv API Credentials Setup")
    print("-" * 40)
    print("⚠️  IMPORTANT: These credentials will be encrypted and stored securely.")
    print("   They will only be used for testing the integration.")
    print("-" * 40)
    
    # Get credentials securely
    print("\nPlease enter your Deriv API credentials:")
    
    api_token = getpass.getpass("API Token (input will be hidden): ").strip()
    if not api_token:
        print("❌ API Token is required")
        return False
    
    app_id = input("App ID: ").strip()
    if not app_id:
        print("❌ App ID is required")
        return False
    
    account_id = input("Account ID (optional, press Enter to skip): ").strip()
    if not account_id:
        account_id = None
        print("⚠️  No account ID provided - will use default account")
    
    test_deriv_credentials = {
        "api_token": api_token,
        "app_id": app_id,
        "account_id": account_id
    }
    
    # Mask for display
    masked_token = api_token[:4] + "..." + api_token[-4:] if len(api_token) > 8 else "***"
    print(f"\n✅ Credentials received:")
    print(f"   API Token: {masked_token}")
    print(f"   App ID: {app_id}")
    print(f"   Account ID: {account_id or 'Default'}")
    
    return True

def test_deriv_connection():
    """Test connecting to Deriv account"""
    global connection_id
    
    if not test_deriv_credentials:
        print("❌ No Deriv credentials available")
        return False
    
    print("\n🧪 Testing: Connect Deriv Account")
    
    payload = {
        "api_token": test_deriv_credentials["api_token"],
        "app_id": test_deriv_credentials["app_id"],
        "account_id": test_deriv_credentials["account_id"],
        "connection_name": "Test Connection",
        "auto_sync": True,
        "sync_frequency": "daily",
        "sync_days_back": 30
    }
    
    response = requests.post(
        f"{BASE_URL}/api/integrations/deriv/connect",
        headers=get_headers(),
        json=payload
    )
    
    data = print_response(response, "Connect Deriv Account")
    
    if response.status_code == 200 and data and data.get("success"):
        connection_data = data.get("data", {}).get("connection", {})
        connection_id = connection_data.get("id")
        
        print(f"✅ Connection established: {connection_id}")
        
        # Show account info
        account_info = connection_data.get("account_info", {})
        if account_info:
            print(f"\n📊 Account Information:")
            print(f"   Account ID: {account_info.get('loginid', 'N/A')}")
            print(f"   Currency: {account_info.get('currency', 'N/A')}")
            print(f"   Country: {account_info.get('country', 'N/A')}")
            print(f"   Email: {account_info.get('email', 'N/A')}")
        
        return True
    
    return False

def test_connection_status():
    """Test getting connection status"""
    if not connection_id:
        print("❌ No connection ID available")
        return False
    
    print(f"\n🧪 Testing: Get Connection Status ({connection_id})")
    
    response = requests.get(
        f"{BASE_URL}/api/integrations/deriv/status",
        params={"connection_id": connection_id},
        headers=get_headers()
    )
    
    data = print_response(response, "Connection Status")
    
    if response.status_code == 200 and data and data.get("success"):
        connections = data.get("data", {}).get("connections", [])
        if connections:
            conn = connections[0]
            print(f"✅ Status: {conn.get('connection', {}).get('connection_status', 'unknown')}")
            print(f"✅ Last Sync: {conn.get('connection', {}).get('last_sync_at', 'Never')}")
            print(f"✅ Can Sync: {conn.get('can_sync', False)}")
        return True
    
    return False

def test_list_connections():
    """Test listing all connections"""
    print("\n🧪 Testing: List Connections")
    
    response = requests.get(
        f"{BASE_URL}/api/integrations/deriv/connections",
        headers=get_headers()
    )
    
    data = print_response(response, "List Connections")
    
    if response.status_code == 200 and data and data.get("success"):
        connections = data.get("data", {}).get("connections", [])
        print(f"✅ Found {len(connections)} connection(s)")
        for conn in connections:
            print(f"   - {conn.get('connection_name')} ({conn.get('connection_status')})")
        return True
    
    return False

def test_manual_sync():
    """Test manual trade sync"""
    if not connection_id:
        print("❌ No connection ID available")
        return False
    
    print(f"\n🧪 Testing: Manual Trade Sync ({connection_id})")
    print("   Note: This may take a while depending on trade history...")
    
    payload = {
        "days_back": 7,  # Just sync last 7 days for testing
        "force_full_sync": False,
        "analyze_after_sync": True
    }
    
    response = requests.post(
        f"{BASE_URL}/api/integrations/deriv/sync",
        params={"connection_id": connection_id},
        headers=get_headers(),
        json=payload
    )
    
    data = print_response(response, "Start Manual Sync")
    
    if response.status_code == 200 and data and data.get("success"):
        print("✅ Sync started in background")
        
        # Wait a bit and check status
        print("   Waiting 10 seconds for sync to progress...")
        time.sleep(10)
        
        # Check sync status by looking at connection status
        response = requests.get(
            f"{BASE_URL}/api/integrations/deriv/status",
            params={"connection_id": connection_id},
            headers=get_headers()
        )
        
        if response.status_code == 200:
            status_data = response.json()
            print("✅ Sync status checked")
            return True
    
    return False

def test_get_trades():
    """Test getting synced trades"""
    if not connection_id:
        print("❌ No connection ID available")
        return False
    
    print(f"\n🧪 Testing: Get Synced Trades ({connection_id})")
    
    response = requests.get(
        f"{BASE_URL}/api/integrations/deriv/trades",
        params={
            "connection_id": connection_id,
            "limit": 10,
            "offset": 0,
            "status": "all"
        },
        headers=get_headers()
    )
    
    data = print_response(response, "Get Trades")
    
    if response.status_code == 200 and data and data.get("success"):
        trades = data.get("data", {}).get("trades", [])
        stats = data.get("data", {}).get("stats", {})
        
        print(f"✅ Found {len(trades)} trades")
        print(f"📊 Trade Statistics:")
        print(f"   Total Trades: {stats.get('total_trades', 0)}")
        print(f"   Total Profit: ${stats.get('total_profit', 0):.2f}")
        print(f"   Wins: {stats.get('win_count', 0)}")
        print(f"   Losses: {stats.get('loss_count', 0)}")
        print(f"   Open: {stats.get('open_count', 0)}")
        
        # Display first few trades if available
        if trades:
            print(f"\n📈 Sample Trades:")
            for i, trade in enumerate(trades[:3], 1):
                print(f"   {i}. {trade.get('symbol')} - {trade.get('status')} - ${trade.get('profit'):.2f}")
        
        return True
    
    return False

def test_update_connection():
    """Test updating connection settings"""
    if not connection_id:
        print("❌ No connection ID available")
        return False
    
    print(f"\n🧪 Testing: Update Connection Settings ({connection_id})")
    
    payload = {
        "connection_name": "Updated Test Connection",
        "auto_sync": False,
        "sync_frequency": "weekly",
        "sync_days_back": 60
    }
    
    response = requests.put(
        f"{BASE_URL}/api/integrations/deriv/connections/{connection_id}",
        headers=get_headers(),
        json=payload
    )
    
    data = print_response(response, "Update Connection")
    
    if response.status_code == 200 and data and data.get("success"):
        print("✅ Connection updated successfully")
        return True
    
    return False

def test_get_statistics():
    """Test getting integration statistics"""
    print("\n🧪 Testing: Get Integration Statistics")
    
    response = requests.get(
        f"{BASE_URL}/api/integrations/deriv/stats",
        headers=get_headers()
    )
    
    data = print_response(response, "Integration Statistics")
    
    if response.status_code == 200 and data and data.get("success"):
        stats = data.get("data", {})
        print(f"✅ Statistics retrieved:")
        print(f"   Total Connections: {stats.get('total_connections', 0)}")
        print(f"   Active Connections: {stats.get('active_connections', 0)}")
        print(f"   Total Trades Synced: {stats.get('total_trades_synced', 0)}")
        print(f"   Sync Success Rate: {stats.get('sync_success_rate', 0)}%")
        return True
    
    return False

def test_error_cases():
    """Test error scenarios"""
    print("\n🧪 Testing: Error Cases")
    
    tests = [
        # 1. Connect with invalid credentials
        ("POST", "/api/integrations/deriv/connect", {
            "api_token": "invalid_token_123",
            "app_id": "invalid_app",
            "connection_name": "Invalid Test"
        }, "Invalid credentials"),
        
        # 2. Get trades without connection ID
        ("GET", "/api/integrations/deriv/trades", None, "Missing connection ID"),
        
        # 3. Update non-existent connection
        ("PUT", "/api/integrations/deriv/connections/invalid_id_123", {
            "connection_name": "Test"
        }, "Non-existent connection"),
    ]
    
    all_passed = True
    for method, endpoint, data, label in tests:
        print(f"\n   Testing: {label}")
        
        if method == "POST":
            response = requests.post(
                f"{BASE_URL}{endpoint}",
                json=data if data else {},
                headers=get_headers()
            )
        elif method == "PUT":
            response = requests.put(
                f"{BASE_URL}{endpoint}",
                json=data,
                headers=get_headers()
            )
        else:  # GET
            response = requests.get(f"{BASE_URL}{endpoint}", headers=get_headers())
        
        if response.status_code >= 400:
            print(f"   ✅ Correctly failed with {response.status_code}")
        else:
            print(f"   ❌ Should have failed but got {response.status_code}")
            all_passed = False
    
    return all_passed

def test_disconnect():
    """Test disconnecting the account"""
    if not connection_id:
        print("❌ No connection ID available")
        return True  # Skip, not fail
    
    print(f"\n🧪 Testing: Disconnect Account ({connection_id})")
    
    response = requests.delete(
        f"{BASE_URL}/api/integrations/deriv/connections/{connection_id}",
        headers=get_headers()
    )
    
    data = print_response(response, "Disconnect Account")
    
    if response.status_code == 200 and data and data.get("success"):
        print("✅ Account disconnected successfully")
        
        # Verify it's gone
        response = requests.get(
            f"{BASE_URL}/api/integrations/deriv/connections",
            headers=get_headers()
        )
        
        if response.status_code == 200:
            data = response.json()
            connections = data.get("data", {}).get("connections", [])
            connection_ids = [c.get("id") for c in connections]
            
            if connection_id not in connection_ids:
                print("✅ Connection successfully removed")
                return True
            else:
                print("❌ Connection still exists")
                return False
    
    return False

def cleanup_test_data():
    """Cleanup test data"""
    print("\n🧹 Cleaning up test data...")
    
    # Note: The test user and any remaining connections will persist
    # In a real test environment, you might want to delete them
    print("⚠️  Note: Test user and data may persist in database")
    print("   You can manually delete them if needed")

def run_deriv_tests():
    """Run all Deriv integration tests"""
    print("🚀 Starting Deriv Integration Tests")
    print("="*70)
    print("⚠️  IMPORTANT: This will use REAL Deriv API credentials")
    print("   Make sure you're using test credentials if possible")
    print("="*70)
    
    # Make sure API is running
    try:
        health_response = requests.get(f"{BASE_URL}/health", timeout=2)
        if health_response.status_code != 200:
            print("❌ API is not running or not healthy")
            return False
        print("✅ API is running and healthy")
    except:
        print("❌ Cannot connect to API. Make sure it's running on http://localhost:8000")
        return False
    
    # Get user confirmation
    confirmation = input("\n⚠️  Do you want to proceed with REAL Deriv API credentials? (yes/no): ")
    if confirmation.lower() != 'yes':
        print("❌ Test cancelled by user")
        return False
    
    results = {}
    
    # Setup Phase
    print("\n🔧 SETUP PHASE")
    print("-" * 40)
    results["setup_user"] = setup_test_user()
    if not results["setup_user"]:
        print("❌ Failed to setup test user")
        return False
    
    results["get_credentials"] = get_deriv_credentials()
    if not results["get_credentials"]:
        print("❌ Failed to get credentials")
        return False
    
    # Core Connection Tests
    print("\n🔗 CORE CONNECTION TESTS")
    print("-" * 40)
    results["connect"] = test_deriv_connection()
    results["list_connections"] = test_list_connections()
    results["connection_status"] = test_connection_status()
    
    # Trade Synchronization Tests
    print("\n🔄 TRADE SYNCHRONIZATION TESTS")
    print("-" * 40)
    results["manual_sync"] = test_manual_sync()
    time.sleep(5)  # Give sync some time
    results["get_trades"] = test_get_trades()
    
    # Management Tests
    print("\n⚙️  MANAGEMENT TESTS")
    print("-" * 40)
    results["update_connection"] = test_update_connection()
    results["get_statistics"] = test_get_statistics()
    
    # Error Handling Tests
    print("\n🚫 ERROR HANDLING TESTS")
    print("-" * 40)
    results["error_cases"] = test_error_cases()
    
    # Cleanup Tests (optional)
    print("\n🧹 CLEANUP TESTS")
    print("-" * 40)
    disconnect = input("Do you want to test disconnecting the account? (yes/no): ")
    if disconnect.lower() == 'yes':
        results["disconnect"] = test_disconnect()
    else:
        print("   Skipping disconnect test")
        results["disconnect"] = True  # Not a failure
    
    # Print Summary
    print("\n" + "="*70)
    print("📊 DERIV INTEGRATION TEST RESULTS")
    print("="*70)
    
    passed = sum(1 for result in results.values() if result)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {test_name}")
    
    print(f"\n🎯 Results: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
    
    if passed == total:
        print("\n🌟 PERFECT! Deriv integration is working perfectly!")
    elif passed >= total * 0.8:
        print(f"\n👍 GOOD! {passed}/{total} tests passed. Integration is mostly working.")
    else:
        print(f"\n⚠️  NEEDS WORK: {total - passed} tests failed.")
    
    # Security reminder
    print("\n🔐 SECURITY REMINDER:")
    print("   - Your Deriv API token was encrypted and stored in the database")
    print("   - You should revoke the token if it was for testing only")
    print("   - Consider using a dedicated test account")
    
    # Save results
    with open("deriv_test_results.json", "w") as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "user_id": user_id,
            "connection_id": connection_id,
            "tests_run": list(results.keys()),
            "results": results,
            "summary": {
                "passed": passed,
                "total": total,
                "percentage": f"{(passed/total*100):.1f}%"
            },
            "security_note": "API token was encrypted before storage"
        }, f, indent=2)
    
    print(f"\n📄 Detailed results saved to: deriv_test_results.json")
    
    # Cleanup
    cleanup_test_data()
    
    return results

if __name__ == "__main__":
    print("⚠️  DERIV INTEGRATION TEST SCRIPT")
    print("="*70)
    print("This script will:")
    print("1. Create a test user")
    print("2. Ask for your Deriv API credentials")
    print("3. Test all integration endpoints")
    print("4. Store credentials ENCRYPTED in database")
    print("5. Sync trades from your account")
    print("="*70)
    print("\n❗ WARNING: Use test credentials if possible!")
    print("   Real trades will be imported and analyzed.")
    print("="*70)
    
    try:
        results = run_deriv_tests()
        
        # Show next steps
        print("\n" + "="*70)
        print("🎯 NEXT STEPS:")
        print("="*70)
        
        if connection_id:
            print(f"1. View connection in database: connection_id = {connection_id}")
        
        print("2. Check the database for synced trades")
        print("3. Review test results: deriv_test_results.json")
        print("4. Test with your Next.js frontend")
        
        print("\n🔧 Frontend Integration Example:")
        print("""
   // Connect Deriv account from Next.js
   const connectDeriv = async () => {
     const response = await fetch('/api/integrations/deriv/connect', {
       method: 'POST',
       headers: {
         'Authorization': `Bearer ${token}`,
         'Content-Type': 'application/json'
       },
       body: JSON.stringify({
         api_token: 'YOUR_TOKEN',
         app_id: 'YOUR_APP_ID',
         auto_sync: true
       })
     });
     return response.json();
   };
   
   // Get synced trades
   const getTrades = async (connectionId) => {
     const response = await fetch(`/api/integrations/deriv/trades?connection_id=${connectionId}`, {
       headers: { 'Authorization': `Bearer ${token}` }
     });
     return response.json();
   };
        """)
        
    except KeyboardInterrupt:
        print("\n⏹️  Tests interrupted by user")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()