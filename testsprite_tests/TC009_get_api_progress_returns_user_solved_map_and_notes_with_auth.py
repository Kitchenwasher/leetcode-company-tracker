import requests
import uuid
import sys

BASE_URL = "http://localhost:5000"
TIMEOUT = 30


def test_tc009_get_api_progress_returns_user_solved_map_and_notes_with_auth():
    session = requests.Session()
    headers = {"Content-Type": "application/json"}
    email = f"test+{uuid.uuid4().hex}@example.com"
    username = f"testuser_{uuid.uuid4().hex[:8]}"
    password = "TestPass!234"

    register_url = f"{BASE_URL}/api/auth/register"
    login_url = f"{BASE_URL}/api/auth/login"
    progress_url = f"{BASE_URL}/api/progress"
    logout_url = f"{BASE_URL}/api/auth/logout"

    try:
        # Register a new user
        reg_payload = {"email": email, "username": username, "password": password}
        try:
            reg_resp = session.post(register_url, json=reg_payload, headers=headers, timeout=TIMEOUT)
        except requests.exceptions.RequestException as e:
            raise AssertionError(f"Register request failed: {e}")
        assert reg_resp.status_code == 201, f"Expected 201 from register, got {reg_resp.status_code}: {reg_resp.text}"

        # Login to obtain access token and session cookie
        login_payload = {"email": email, "password": password}
        try:
            login_resp = session.post(login_url, json=login_payload, headers=headers, timeout=TIMEOUT)
        except requests.exceptions.RequestException as e:
            raise AssertionError(f"Login request failed: {e}")
        assert login_resp.status_code == 200, f"Expected 200 from login, got {login_resp.status_code}: {login_resp.text}"

        token = None
        try:
            resp_json = login_resp.json()
            token = resp_json.get("accessToken") or resp_json.get("token") or resp_json.get("access_token")
        except ValueError:
            # response not JSON - proceed relying on cookies stored in session
            token = None

        auth_headers = headers.copy()
        if token:
            auth_headers["Authorization"] = f"Bearer {token}"

        # 1) Call GET /api/progress without authentication -> expect 401
        try:
            unauth_resp = requests.get(progress_url, headers={"Content-Type": "application/json"}, timeout=TIMEOUT)
        except requests.exceptions.RequestException as e:
            raise AssertionError(f"Unauthenticated GET /api/progress request failed: {e}")
        assert unauth_resp.status_code == 401, f"Expected 401 without auth, got {unauth_resp.status_code}: {unauth_resp.text}"

        # 2) Call GET /api/progress with authentication -> expect 200 and response contains solved map and notes
        try:
            # use session (to include cookies) and Authorization header if available
            auth_combined_headers = auth_headers
            auth_resp = session.get(progress_url, headers=auth_combined_headers, timeout=TIMEOUT)
        except requests.exceptions.RequestException as e:
            raise AssertionError(f"Authenticated GET /api/progress request failed: {e}")

        assert auth_resp.status_code == 200, f"Expected 200 with auth, got {auth_resp.status_code}: {auth_resp.text}"

        try:
            progress_json = auth_resp.json()
        except ValueError:
            raise AssertionError(f"Expected JSON response for authenticated progress, got: {auth_resp.text}")

        assert isinstance(progress_json, dict), f"Expected progress response to be a JSON object, got: {type(progress_json)}"

        # Flexible checks for keys indicating solved map and personal notes
        solved_keys_candidates = ["solved", "solvedMap", "map", "solvedQuestions", "progress"]
        notes_keys_candidates = ["notes", "personalNotes", "userNotes", "notesMap"]

        has_solved = any(key in progress_json for key in solved_keys_candidates)
        has_notes = any(key in progress_json for key in notes_keys_candidates)

        # It's acceptable if solved map or notes are nested under a common structure; also allow if top-level has both under 'data'
        if not (has_solved and has_notes):
            # attempt to look under 'data' if present
            data = progress_json.get("data")
            if isinstance(data, dict):
                has_solved = has_solved or any(key in data for key in solved_keys_candidates)
                has_notes = has_notes or any(key in data for key in notes_keys_candidates)

        assert has_solved, f"Authenticated progress response does not contain solved map keys. Response keys: {list(progress_json.keys())}"
        assert has_notes, f"Authenticated progress response does not contain notes keys. Response keys: {list(progress_json.keys())}"

    finally:
        # Attempt to logout to clear session / refresh cookie. This is best-effort cleanup.
        try:
            # Use session to include any cookies; include Authorization header if available
            cleanup_headers = headers.copy()
            if 'token' in locals() and token:
                cleanup_headers["Authorization"] = f"Bearer {token}"
            session.post(logout_url, headers=cleanup_headers, timeout=TIMEOUT)
        except Exception:
            pass


if __name__ == "__main__":
    try:
        test_tc009_get_api_progress_returns_user_solved_map_and_notes_with_auth()
        print("TC009 passed")
    except AssertionError as e:
        print(f"TC009 failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"TC009 encountered an unexpected error: {e}")
        sys.exit(2)