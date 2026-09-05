def test_login_success(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "test@medlens.com", "password": "TestPassword123!"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_failure(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "test@medlens.com", "password": "WrongPassword!"}
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password."

def test_register_user(client):
    response = client.post(
        "/api/v1/auth/register",
        json={"name": "New User", "email": "new@medlens.com", "password": "NewPassword123!"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    
def test_get_me(client):
    # First login to get token
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "test@medlens.com", "password": "TestPassword123!"}
    )
    token = login_res.json()["access_token"]
    
    # Use token to get user info
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@medlens.com"
    assert data["name"] == "Test Doctor"
