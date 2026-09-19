import requests
import uuid
import traceback

BASE_URL = "http://localhost:5000"
TIMEOUT = 30


def test_post_api_auth_register_creates_new_user_with_valid_data():
    headers = {"Content-Type": "application/json"}
    unique_suffix = uuid.uuid4().hex[:8]
    email = f"testuser_{unique_suffix}@example.com"
    username = f"testuser_{unique_suffix}"
    password = "Password123!"

    created_user_info = None

    try:
        # 1) Positive case: valid registration -> 201
        payload = {"email": email, "username": username, "password": password}
        resp = requests.post(f"{BASE_URL}/api/auth/register", json=payload, headers=headers, timeout=TIMEOUT)
        assert resp.status_code == 201, f"Expected 201 for valid registration, got {resp.status_code}. Body: {resp.text}"
        try:
            created_user_info = resp.json()
        except Exception:
            created_user_info = None

        # Basic validation of returned body if present
        if isinstance(created_user_info, dict):
            # Expect at least username or email echoed back or an id
            assert any(k in created_user_info for k in ("email", "username", "id")), \
                f"Registration 201 response JSON missing expected keys. JSON: {created_user_info}"

        # 2) Negative cases: missing/invalid fields -> 400
        # missing email
        payload_missing_email = {"username": username + "_me", "password": password}
        resp = requests.post(f"{BASE_URL}/api/auth/register", json=payload_missing_email, headers=headers, timeout=TIMEOUT)
        assert resp.status_code == 400, f"Expected 400 for missing email, got {resp.status_code}. Body: {resp.text}"

        # missing username
        payload_missing_username = {"email": f"no_username_{unique_suffix}@example.com", "password": password}
        resp = requests.post(f"{BASE_URL}/api/auth/register", json=payload_missing_username, headers=headers, timeout=TIMEOUT)
        assert resp.status_code == 400, f"Expected 400 for missing username, got {resp.status_code}. Body: {resp.text}"

        # missing password
        payload_missing_password = {"email": f"no_password_{unique_suffix}@example.com", "username": username + "_nopw"}
        resp = requests.post(f"{BASE_URL}/api/auth/register", json=payload_missing_password, headers=headers, timeout=TIMEOUT)
        assert resp.status_code == 400, f"Expected 400 for missing password, got {resp.status_code}. Body: {resp.text}"

        # invalid email format
        payload_bad_email = {"email": "not-an-email", "username": username + "_bademail", "password": password}
        resp = requests.post(f"{BASE_URL}/api/auth/register", json=payload_bad_email, headers=headers, timeout=TIMEOUT)
        assert resp.status_code == 400, f"Expected 400 for invalid email format, got {resp.status_code}. Body: {resp.text}"

        print("TC007: All assertions passed for register positive and negative cases.")

    except AssertionError:
        traceback.print_exc()
        raise
    except Exception:
        traceback.print_exc()
        raise
    finally:
        # Cleanup: best-effort attempt to remove the created test user.
        # Try to login to obtain an access token/cookie, then attempt DELETE on likely endpoints.
        try:
            if created_user_info is None:
                # If registration didn't return JSON but status was 201, still attempt login using credentials
                pass

            login_payload = {"email": email, "password": password}
            try:
                login_resp = requests.post(f"{BASE_URL}/api/auth/login", json=login_payload, headers=headers, timeout=TIMEOUT)
            except Exception:
                login_resp = None

            auth_headers = {}
            cookies = None
            if login_resp is not None and login_resp.status_code == 200:
                cookies = login_resp.cookies
                try:
                    token_json = login_resp.json()
                except Exception:
                    token_json = {}
                token = token_json.get("accessToken") or token_json.get("token") or token_json.get("access_token")
                if token:
                    auth_headers["Authorization"] = f"Bearer {token}"

            # Candidate delete endpoints to try (best-effort)
            delete_endpoints = [
                f"{BASE_URL}/api/auth/delete",  # possible pattern
                f"{BASE_URL}/api/users/{username}",  # direct user path
                f"{BASE_URL}/api/users/{email}",  # by email
                f"{BASE_URL}/api/users/me",  # current user
                f"{BASE_URL}/api/users",  # collection (may accept body)
            ]

            deleted = False
            for url in delete_endpoints:
                try:
                    # If endpoint is collection and requires body, send username/email
                    if url.rstrip("/").endswith("/api/users"):
                        resp = requests.delete(url, json={"email": email, "username": username}, headers={**headers, **auth_headers}, cookies=cookies, timeout=TIMEOUT)
                    else:
                        resp = requests.delete(url, headers={**headers, **auth_headers}, cookies=cookies, timeout=TIMEOUT)
                    if resp.status_code in (200, 202, 204):
                        deleted = True
                        break
                except Exception:
                    # ignore and try next
                    continue

            if not deleted:
                # As a last resort, attempt POST to a common test-cleanup path
                try:
                    resp = requests.post(f"{BASE_URL}/api/test/cleanup", json={"email": email, "username": username}, headers=headers, timeout=TIMEOUT)
                    if resp.status_code in (200, 202, 204):
                        deleted = True
                except Exception:
                    pass

            if deleted:
                print(f"TC007: Cleanup succeeded for user {username}.")
            else:
                print(f"TC007: Cleanup could not confirm deletion for user {username}. (best-effort attempted)")

        except Exception:
            traceback.print_exc()


if __name__ == "__main__":
    test_post_api_auth_register_creates_new_user_with_valid_data()