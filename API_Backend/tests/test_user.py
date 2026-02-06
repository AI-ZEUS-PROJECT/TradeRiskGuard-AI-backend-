"""
Test script for User Management API
"""
import requests
import json

BASE_URL = "http://localhost:8000"

"""
Test script for User Management API
"""
import requests
import json
import pytest

BASE_URL = "http://localhost:8000"

def test_user_registration():
    """Test user registration"""
    import time
    
    timestamp = int(time.time())
    payload = {
        "email": f"trader_{timestamp}@example.com",
        "username": f"trader_{timestamp}",
        "password": "SecurePass1234!"
    }
    
    response = requests.post(
        f"{BASE_URL}/api/users/register",
        json=payload
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "access_token" in data["data"]

def test_user_login(token):
    """Test user login"""
    
    # The token fixture already handles login, so we just need to assert that the token is valid
    assert token is not None

def test_user_profile(token):
    """Test getting user profile with token"""
    
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    response = requests.get(
        f"{BASE_URL}/api/users/profile",
        headers=headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["email"] == "testuser@example.com"


def test_user_settings(token):
    """Test user settings endpoints"""
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Get current settings
    response = requests.get(
        f"{BASE_URL}/api/users/settings",
        headers=headers
    )
    assert response.status_code == 200
    
    # Update settings
    update_payload = {
        "max_position_size_pct": 3.0,
        "min_win_rate": 35.0,
        "ai_enabled": True
    }
    
    response = requests.put(
        f"{BASE_URL}/api/users/settings",
        headers=headers,
        json=update_payload
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["max_position_size_pct"] == 3.0


def test_invalid_requests():
    """Test error cases"""
    
    # Test duplicate registration
    payload = {
        "email": "testuser@example.com",
        "username": "testuser",
        "password": "AnotherPass123!"
    }
    
    response = requests.post(
        f"{BASE_URL}/api/users/register",
        json=payload
    )
    assert response.status_code == 400
    
    # Test invalid login
    payload = {
        "email": "testuser@example.com",
        "password": "WrongPassword"
    }
    
    response = requests.post(
        f"{BASE_URL}/api/users/login",
        json=payload
    )
    assert response.status_code == 401
    
    # Test profile without token
    response = requests.get(f"{BASE_URL}/api/users/profile")
    assert response.status_code == 401