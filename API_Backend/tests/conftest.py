import pytest
import requests
import json

BASE_URL = "http://localhost:8000"

@pytest.fixture(scope="session")
def token():
    """
    Fixture to get an authentication token.
    """
    # 1. Register a new user
    register_payload = {
        "email": "testuser@example.com",
        "username": "testuser",
        "password": "SecurePassword123!"
    }
    requests.post(f"{BASE_URL}/api/users/register", json=register_payload)

    # 2. Log in to get the token
    login_payload = {
        "email": "testuser@example.com",
        "password": "SecurePassword123!"
    }
    response = requests.post(f"{BASE_URL}/api/users/login", json=login_payload)
    
    if response.status_code == 200:
        data = response.json()
        access_token = data.get("data", {}).get("access_token")
        if access_token:
            return access_token
    
    # If we couldn't get a token, fail the tests that need it.
    pytest.fail("Failed to get authentication token.")
