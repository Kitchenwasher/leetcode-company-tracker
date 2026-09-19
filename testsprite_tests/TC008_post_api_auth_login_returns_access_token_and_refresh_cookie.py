import requests
import uuid
import time

BASE_URL = "http://localhost:5000"
TIMEOUT = 30

def test_post_api_auth_login_returns_access_token_and_refresh_cookie():
    # Create unique user data
    unique_suffix = uuid.uuid4().hex[:8]
    email = f"testuser_{unique_suffix}@example.com"
    username = f"testuser_{unique_suffix}"
    password = f"P@ssw0rd!{unique_suffix}"

    register_url = f"{BASE_URL}/api/auth/register"
    login_url = f"{BASE_URL}/api/auth/login"
    headers = {"Content-Type": "application/json"}

    created_user_id = None
    session = requests.Session()

    try:
        # 1) Register a new user (expected 201)
        reg_payload = {"email": email, "username": username, "password": password}
        try:
            reg_resp = session.post(register_url, json=reg_payload, headers=headers, timeout=TIMEOUT)
        except requests.exceptions.RequestException as e:
            raise AssertionError(f"Registration request failed: {e}")

        assert reg_resp is not None, "No response from register endpoint"
        assert reg_resp.status_code == 201, f"Expected 201 for registration, got {reg_resp.status_code}, body: {reg_resp.text}"

        # Capture possible returned user id for cleanup
        try:
            reg_json = reg_resp.json()
            # look for common id fields
            created_user_id = reg_json.get("id") or reg_json.get("userId") or reg_json.get("user_id")
        except Exception:
            created_user_id = None

        # 2) Login with valid credentials (expected 200, access token in body, refresh cookie set HttpOnly)
        login_payload = {"email": email, "password": password}
        try:
            login_resp = session.post(login_url, json=login_payload, headers=headers, timeout=TIMEOUT)
        except requests.exceptions.RequestException as e:
            raise AssertionError(f"Login request (valid credentials) failed: {e}")

        assert login_resp is not None, "No response from login endpoint (valid credentials)"
        assert login_resp.status_code == 200, f"Expected 200 for valid login, got {login_resp.status_code}, body: {login_resp.text}"

        # Validate access token present in JSON response (key containing 'token' or 'access')
        try:
            login_json = login_resp.json()
        except ValueError:
            raise AssertionError("Login response did not contain valid JSON for valid credentials")

        def contains_token(obj):
            if not isinstance(obj, dict):
                return False
            for k, v in obj.items():
                if isinstance(k, str) and ("token" in k.lower() or "access" in k.lower()):
                    if isinstance(v, str) and len(v) > 0:
                        return True
                # nested dicts
                if isinstance(v, dict) and contains_token(v):
                    return True
            return False

        assert contains_token(login_json), f"Login JSON did not contain an access token-like field: {login_json}"

        # Validate refresh cookie set and marked HttpOnly
        set_cookie = login_resp.headers.get("Set-Cookie") or login_resp.headers.get("set-cookie")
        assert set_cookie, f"No Set-Cookie header found in login response: headers={login_resp.headers}"

        # Check for HttpOnly flag and presence of a refresh-related cookie name
        set_cookie_lower = set_cookie.lower()
        assert "httponly" in set_cookie_lower, f"Set-Cookie does not include 'HttpOnly': {set_cookie}"
        assert ("refresh" in set_cookie_lower) or ("refresh_token" in set_cookie_lower) or ("refresh-token" in set_cookie_lower) or ("refreshtoken" in set_cookie_lower), \
            f"Set-Cookie header does not appear to contain a refresh cookie name: {set_cookie}"

        # 3) Login with invalid credentials (expected 401)
        bad_login_payload = {"email": email, "password": password + "WRONG"}
        try:
            bad_login_resp = session.post(login_url, json=bad_login_payload, headers=headers, timeout=TIMEOUT)
        except requests.exceptions.RequestException as e:
            raise AssertionError(f"Login request (invalid credentials) failed: {e}")

        assert bad_login_resp is not None, "No response from login endpoint (invalid credentials)"
        assert bad_login_resp.status_code == 401, f"Expected 401 for invalid login, got {bad_login_resp.status_code}, body: {bad_login_resp.text}"

        print("TC008 passed: valid login returns access token and HttpOnly refresh cookie; invalid login returns 401")

    finally:
        # Attempt cleanup: try several plausible delete endpoints. Ignore failures.
        if created_user_id:
            possible_delete_paths = [
                f"/api/auth/users/{created_user_id}",
                f"/api/users/{created_user_id}",
                f"/api/admin/users/{created_user_id}"
            ]
        else:
            possible_delete_paths = [
                f"/api/auth/users/{email}",
                f"/api/users/{email}",
                f"/api/admin/users/{email}"
            ]

        for path in possible_delete_paths:
            try:
                delete_url = f"{BASE_URL}{path}"
                resp = session.delete(delete_url, headers=headers, timeout=10)
                # If deletion succeeded or resource not found, stop trying further
                if resp.status_code in (200, 204, 404):
                    break
            except requests.exceptions.RequestException:
                # ignore and try next
                continue

        # Also attempt logout to clear any server-side session/cookies
        try:
            session.post(f"{BASE_URL}/api/auth/logout", timeout=10)
        except requests.exceptions.RequestException:
            pass

if __name__ == "__main__":
    test_post_api_auth_login_returns_access_token_and_refresh_cookie()