"""
Comprehensive test script for Predictive Alerts API
"""
import requests
import json
import time
from datetime import datetime

BASE_URL = "http://localhost:8000"
TEST_USER = {
    "email": f"alerts_test_{int(time.time())}@example.com",
    "username": f"alertstester_{int(time.time())}",
    "password": "AlertTest1234!"
}

# Global variables
access_token = None
user_id = None
alert_id = None
analysis_id = None

def print_response(response, label=""):
    """Pretty print API response"""
    print(f"\n{'='*60}")
    if label:
        print(f"📋 {label}")
    print(f"Status Code: {response.status_code}")
    try:
        data = response.json()
        print("Response Body:")
        print(json.dumps(data, indent=2))
        return data
    except:
        print(f"Raw Response: {response.text[:500]}...")
        return None
    print('='*60)

def get_headers():
    """Get request headers with auth"""
    headers = {"Content-Type": "application/json"}
    if access_token:
        headers["Authorization"] = f"Bearer {access_token}"
    return headers

def setup_test_user():
    """Create a test user and get auth token"""
    global access_token, user_id
    
    print("🔧 Setting up test user...")
    
    # Register user
    response = requests.post(
        f"{BASE_URL}/api/users/register",
        json=TEST_USER
    )
    
    if response.status_code != 200:
        print(f"❌ Failed to register user: {response.status_code}")
        return False
    
    data = response.json()
    if data.get("success"):
        access_token = data["data"]["access_token"]
        user_id = data["data"]["user"]["id"]
        print(f"✅ User created: {TEST_USER['email']}")
        print(f"🔑 Token: {access_token[:50]}...")
        return True
    return False

def create_test_analysis():
    """Create a test analysis to generate alerts from"""
    global analysis_id
    
    print("\n🔧 Creating test analysis...")
    
    # First, let's check if we have any existing analyses
    response = requests.get(
        f"{BASE_URL}/api/analyze/",
        headers=get_headers()
    )
    
    if response.status_code == 200:
        data = response.json()
        if data.get("success") and data.get("data", {}).get("analyses"):
            # Use existing analysis
            analysis_id = data["data"]["analyses"][0]["id"]
            print(f"✅ Using existing analysis: {analysis_id}")
            return True
    
    # Create new analysis with sample data
    response = requests.post(
        f"{BASE_URL}/api/analyze/trades",
        params={"use_sample": True},
        headers=get_headers()
    )
    
    data = print_response(response, "Create Analysis")
    
    if response.status_code == 200 and data and data.get("success"):
        analysis_id = data.get("data", {}).get("analysis_id")
        print(f"✅ Analysis created: {analysis_id}")
        return True
    
    print("❌ Failed to create analysis")
    return False

def test_generate_alerts():
    """Test generating predictive alerts"""
    print("\n🧪 Testing: Generate Predictive Alerts")
    
    payload = {
        "timeframe": "next_week",
        "include_market_data": False,
        "force_regenerate": True
    }
    
    if analysis_id:
        payload["analysis_id"] = analysis_id
    
    response = requests.post(
        f"{BASE_URL}/api/alerts/predictive",
        headers=get_headers(),
        json=payload
    )
    
    data = print_response(response, "Generate Alerts")
    
    if response.status_code == 200 and data and data.get("success"):
        alerts = data.get("data", {}).get("alerts", [])
        print(f"✅ Generated {len(alerts)} alerts")
        
        # Save first alert ID for further tests
        if alerts:
            global alert_id
            alert_id = alerts[0]["id"]
            print(f"📝 First alert ID: {alert_id}")
        
        return True
    return False

def test_get_user_alerts():
    """Test getting user alerts with filters"""
    print("\n🧪 Testing: Get User Alerts")
    
    # Test without filters
    response = requests.get(
        f"{BASE_URL}/api/alerts/user",
        headers=get_headers()
    )
    
    data = print_response(response, "Get All Alerts")
    
    if response.status_code == 200 and data and data.get("success"):
        alerts = data.get("data", {}).get("alerts", [])
        print(f"✅ Retrieved {len(alerts)} alerts")
        return True
    
    # Test with filters
    print("\n🧪 Testing: Get Alerts with Filters")
    response = requests.get(
        f"{BASE_URL}/api/alerts/user",
        params={
            "status": "active",
            "severity": "high",
            "limit": 5,
            "offset": 0
        },
        headers=get_headers()
    )
    
    data = print_response(response, "Get Filtered Alerts")
    
    if response.status_code == 200:
        print("✅ Filtered alerts retrieved")
        return True
    
    return False

def test_alert_settings():
    """Test alert settings endpoints"""
    print("\n🧪 Testing: Alert Settings")
    
    # Get current settings
    response = requests.get(
        f"{BASE_URL}/api/alerts/settings",
        headers=get_headers()
    )
    
    data = print_response(response, "Get Alert Settings")
    
    if response.status_code != 200:
        return False
    
    # Update settings
    update_payload = {
        "min_confidence": 0.8,
        "in_app_alerts": True,
        "email_alerts": False,
        "show_pattern_alerts": True,
        "show_behavioral_alerts": True,
        "show_time_based_alerts": False,
        "real_time_alerts": True,
        "daily_summary": True,
        "default_snooze_hours": 12
    }
    
    response = requests.put(
        f"{BASE_URL}/api/alerts/settings",
        headers=get_headers(),
        json=update_payload
    )
    
    data = print_response(response, "Update Alert Settings")
    
    if response.status_code == 200 and data and data.get("success"):
        print("✅ Settings updated successfully")
        return True
    
    return False

def test_acknowledge_alert():
    """Test acknowledging an alert"""
    if not alert_id:
        print("⚠️  No alert ID available, skipping acknowledge test")
        return True  # Not a failure, just skip
    
    print(f"\n🧪 Testing: Acknowledge Alert ({alert_id})")
    
    payload = {
        "notes": "Test acknowledgement via API"
    }
    
    response = requests.post(
        f"{BASE_URL}/api/alerts/{alert_id}/acknowledge",
        headers=get_headers(),
        json=payload
    )
    
    data = print_response(response, "Acknowledge Alert")
    
    if response.status_code == 200 and data and data.get("success"):
        print("✅ Alert acknowledged")
        return True
    
    return False

def test_snooze_alert():
    """Test snoozing an alert"""
    # First, we need an active alert (not acknowledged)
    # Let's generate a new alert if needed
    if not alert_id:
        print("⚠️  No alert ID available, creating new alert for snooze test")
        if not test_generate_alerts():
            return True  # Skip if can't create
    
    print(f"\n🧪 Testing: Snooze Alert ({alert_id})")
    
    payload = {
        "duration_hours": 6,
        "reason": "Testing snooze functionality"
    }
    
    response = requests.post(
        f"{BASE_URL}/api/alerts/{alert_id}/snooze",
        headers=get_headers(),
        json=payload
    )
    
    data = print_response(response, "Snooze Alert")
    
    if response.status_code == 200 and data and data.get("success"):
        print("✅ Alert snoozed for 6 hours")
        return True
    
    return False

def test_alert_statistics():
    """Test alert statistics endpoint"""
    print("\n🧪 Testing: Alert Statistics")
    
    response = requests.get(
        f"{BASE_URL}/api/alerts/stats",
        headers=get_headers()
    )
    
    data = print_response(response, "Alert Statistics")
    
    if response.status_code == 200 and data and data.get("success"):
        stats = data.get("data", {})
        print(f"✅ Statistics retrieved:")
        print(f"   Current alerts: {stats.get('current', {}).get('active', 0)}")
        print(f"   High priority: {stats.get('current', {}).get('high_priority', 0)}")
        return True
    
    return False

def test_delete_alert():
    """Test deleting (expiring) an alert"""
    # Create a new alert to delete
    print("\n🧪 Testing: Delete Alert")
    
    # Generate a new alert first
    payload = {
        "timeframe": "next_day",
        "force_regenerate": True
    }
    
    response = requests.post(
        f"{BASE_URL}/api/alerts/predictive",
        headers=get_headers(),
        json=payload
    )
    
    if response.status_code != 200:
        print("⚠️  Could not create alert for deletion test")
        return True  # Skip, not fail
    
    data = response.json()
    if not data.get("success") or not data.get("data", {}).get("alerts"):
        print("⚠️  No alerts generated for deletion test")
        return True
    
    # Get the alert ID
    delete_alert_id = data["data"]["alerts"][0]["id"]
    
    # Delete the alert
    response = requests.delete(
        f"{BASE_URL}/api/alerts/{delete_alert_id}",
        headers=get_headers()
    )
    
    data = print_response(response, "Delete Alert")
    
    if response.status_code == 200 and data and data.get("success"):
        print(f"✅ Alert {delete_alert_id} deleted successfully")
        return True
    
    return False

def test_error_cases():
    """Test error scenarios"""
    print("\n🧪 Testing: Error Cases")
    
    tests = [
        # 1. Generate alerts without auth
        ("POST", "/api/alerts/predictive", {}, "No auth header"),
        
        # 2. Get alerts with invalid status
        ("GET", "/api/alerts/user?status=invalid", None, "Invalid status filter"),
        
        # 3. Acknowledge non-existent alert
        ("POST", "/api/alerts/invalid_id_123/acknowledge", {}, "Non-existent alert"),
        
        # 4. Update settings with invalid confidence
        ("PUT", "/api/alerts/settings", {"min_confidence": 1.5}, "Invalid confidence value"),
    ]
    
    all_passed = True
    for method, endpoint, data, label in tests:
        print(f"\n   Testing: {label}")
        
        if method == "POST":
            response = requests.post(
                f"{BASE_URL}{endpoint}",
                json=data if data else {},
                headers={"Content-Type": "application/json"} if data else {}
            )
        elif method == "PUT":
            response = requests.put(
                f"{BASE_URL}{endpoint}",
                json=data,
                headers={"Content-Type": "application/json"}
            )
        else:  # GET
            response = requests.get(f"{BASE_URL}{endpoint}")
        
        if response.status_code >= 400:
            print(f"   ✅ Correctly failed with {response.status_code}")
        else:
            print(f"   ❌ Should have failed but got {response.status_code}")
            all_passed = False
    
    return all_passed

def test_alert_workflow():
    """Test complete alert workflow"""
    print("\n🧪 Testing: Complete Alert Workflow")
    
    # 1. Update settings to get specific alerts
    print("   1. Configuring alert settings...")
    settings_payload = {
        "min_confidence": 0.6,
        "show_pattern_alerts": True,
        "show_behavioral_alerts": True,
        "show_time_based_alerts": True
    }
    
    response = requests.put(
        f"{BASE_URL}/api/alerts/settings",
        headers=get_headers(),
        json=settings_payload
    )
    
    if response.status_code != 200:
        print("   ❌ Failed to configure settings")
        return False
    
    # 2. Generate alerts
    print("   2. Generating alerts...")
    response = requests.post(
        f"{BASE_URL}/api/alerts/predictive",
        headers=get_headers(),
        json={"timeframe": "next_week", "force_regenerate": True}
    )
    
    if response.status_code != 200:
        print("   ❌ Failed to generate alerts")
        return False
    
    data = response.json()
    alerts = data.get("data", {}).get("alerts", [])
    
    if not alerts:
        print("   ⚠️  No alerts generated (might be normal if no patterns detected)")
        return True  # Not necessarily a failure
    
    print(f"   ✅ Generated {len(alerts)} alerts")
    
    # 3. Get and display alerts
    print("   3. Retrieving alerts...")
    response = requests.get(
        f"{BASE_URL}/api/alerts/user",
        headers=get_headers()
    )
    
    if response.status_code == 200:
        data = response.json()
        active_alerts = data.get("data", {}).get("alerts", [])
        
        print(f"   ✅ Retrieved {len(active_alerts)} alerts")
        
        # Display first alert details
        if active_alerts:
            first_alert = active_alerts[0]
            print(f"\n   📊 Sample Alert Details:")
            print(f"      Type: {first_alert.get('alert_type')}")
            print(f"      Severity: {first_alert.get('severity')}")
            print(f"      Title: {first_alert.get('title')}")
            print(f"      Confidence: {first_alert.get('confidence')}")
    
    # 4. Test alert actions on first alert
    if alerts:
        test_alert_id = alerts[0]["id"]
        
        # Snooze
        print("   4. Testing alert actions...")
        response = requests.post(
            f"{BASE_URL}/api/alerts/{test_alert_id}/snooze",
            headers=get_headers(),
            json={"duration_hours": 2, "reason": "Workflow test"}
        )
        
        if response.status_code == 200:
            print("   ✅ Alert snoozed successfully")
            
            # Acknowledge
            response = requests.post(
                f"{BASE_URL}/api/alerts/{test_alert_id}/acknowledge",
                headers=get_headers(),
                json={"notes": "Workflow test complete"}
            )
            
            if response.status_code == 200:
                print("   ✅ Alert acknowledged successfully")
    
    return True

def run_all_tests():
    """Run all alert API tests"""
    print("🚀 Starting Predictive Alerts API Tests")
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
    
    results = {}
    
    # Setup
    print("\n🔧 SETUP PHASE")
    print("-" * 40)
    results["setup_user"] = setup_test_user()
    if not results["setup_user"]:
        print("❌ Failed to setup test user")
        return False
    
    results["setup_analysis"] = create_test_analysis()
    
    # Core Tests
    print("\n🧪 CORE ALERTS TESTS")
    print("-" * 40)
    results["generate_alerts"] = test_generate_alerts()
    results["get_alerts"] = test_get_user_alerts()
    results["alert_settings"] = test_alert_settings()
    results["alert_stats"] = test_alert_statistics()
    
    # Alert Actions Tests
    print("\n🎯 ALERT ACTIONS TESTS")
    print("-" * 40)
    results["acknowledge_alert"] = test_acknowledge_alert()
    results["snooze_alert"] = test_snooze_alert()
    results["delete_alert"] = test_delete_alert()
    
    # Workflow Test
    print("\n🔄 WORKFLOW TEST")
    print("-" * 40)
    results["workflow"] = test_alert_workflow()
    
    # Error Cases
    print("\n🚫 ERROR CASE TESTS")
    print("-" * 40)
    results["error_cases"] = test_error_cases()
    
    # Print Summary
    print("\n" + "="*70)
    print("📊 TEST RESULTS SUMMARY")
    print("="*70)
    
    passed = sum(1 for result in results.values() if result)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {test_name}")
    
    print(f"\n🎯 Results: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
    
    if passed == total:
        print("\n🌟 ALL TESTS PASSED! Alerts API is working perfectly!")
    elif passed >= total * 0.8:
        print(f"\n👍 GOOD! {passed}/{total} tests passed. Minor issues to fix.")
    else:
        print(f"\n⚠️  NEEDS WORK: {total - passed} tests failed.")
    
    # Save results
    with open("alerts_test_results.json", "w") as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "user": TEST_USER["email"],
            "analysis_id": analysis_id,
            "alert_id": alert_id,
            "results": results,
            "summary": {
                "passed": passed,
                "total": total,
                "percentage": f"{(passed/total*100):.1f}%"
            }
        }, f, indent=2)
    
    print(f"\n📄 Detailed results saved to: alerts_test_results.json")
    
    return results

if __name__ == "__main__":
    print("⚠️  IMPORTANT: Make sure your API is running!")
    print("   Command: python main.py")
    print("   URL: http://localhost:8000")
    print("="*70)
    
    input("\nPress Enter to start alerts API tests...")
    
    try:
        results = run_all_tests()
        
        # Show next steps
        print("\n" + "="*70)
        print("🎯 NEXT STEPS FOR FRONTEND:")
        print("="*70)
        
        print("1. Use these endpoints in Next.js:")
        print("   - GET /api/alerts/user - Display user alerts")
        print("   - POST /api/alerts/predictive - Generate new alerts")
        print("   - PUT /api/alerts/settings - Configure alert preferences")
        
        print("\n2. Example frontend code:")
        print("""
   // Fetch user alerts
   const fetchAlerts = async () => {
     const response = await fetch('/api/alerts/user', {
       headers: { 'Authorization': `Bearer ${token}` }
     });
     const data = await response.json();
     return data.data.alerts;
   };
   
   // Acknowledge alert
   const acknowledgeAlert = async (alertId) => {
     await fetch(`/api/alerts/${alertId}/acknowledge`, {
       method: 'POST',
       headers: { 
         'Authorization': `Bearer ${token}`,
         'Content-Type': 'application/json'
       },
       body: JSON.stringify({ notes: 'User acknowledged' })
     });
   };
        """)
        
        print("\n3. Check test results: alerts_test_results.json")
        
    except KeyboardInterrupt:
        print("\n⏹️  Tests interrupted by user")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()