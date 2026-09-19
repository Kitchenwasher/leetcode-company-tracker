import requests
import time
import uuid
import sys

BASE_URL = "http://localhost:5000"
TIMEOUT = 30


def test_post_payments_create_checkout_session_with_valid_plan():
    session = requests.Session()
    unique_suffix = str(int(time.time())) + "-" + uuid.uuid4().hex[:6]
    email = f"testuser+{unique_suffix}@example.com"
    username = f"testuser_{unique_suffix}"
    password = "TestPassw0rd!"

    register_url = f"{BASE_URL}/api/auth/register"
    login_url = f"{BASE_URL}/api/auth/login"
    plans_url = f"{BASE_URL}/api/payments/plans"
    create_session_url = f"{BASE_URL}/api/payments/create-checkout-session"
    logout_url = f"{BASE_URL}/api/auth/logout"

    access_token = None

    try:
        # 1) Register a new user
        reg_payload = {"email": email, "username": username, "password": password}
        r = session.post(register_url, json=reg_payload, timeout=TIMEOUT)
        assert r.status_code == 201, f"Expected 201 on register, got {r.status_code}, body: {r.text}"

        # 2) Login to obtain access token (and cookies)
        login_payload = {"email": email, "password": password}
        r = session.post(login_url, json=login_payload, timeout=TIMEOUT)
        assert r.status_code == 200, f"Expected 200 on login, got {r.status_code}, body: {r.text}"
        login_json = {}
        try:
            login_json = r.json()
        except ValueError:
            raise AssertionError(f"Login response not JSON: {r.text}")

        # Extract access token from common fields
        for key in ("accessToken", "access_token", "token", "authToken"):
            if key in login_json and isinstance(login_json[key], str) and login_json[key]:
                access_token = login_json[key]
                break
        # Sometimes token may be nested
        if not access_token:
            # look for data.token or data.accessToken
            if isinstance(login_json.get("data"), dict):
                for key in ("accessToken", "access_token", "token"):
                    if key in login_json["data"] and isinstance(login_json["data"][key], str):
                        access_token = login_json["data"][key]
                        break

        assert access_token, f"Access token not found in login response: {login_json}"

        auth_headers = {"Authorization": f"Bearer {access_token}"}

        # 3) Retrieve available plans (no auth required per PRD)
        r = session.get(plans_url, timeout=TIMEOUT)
        assert r.status_code == 200, f"Expected 200 from plans endpoint, got {r.status_code}, body: {r.text}"
        plans_json = {}
        try:
            plans_json = r.json()
        except ValueError:
            raise AssertionError(f"Plans response not JSON: {r.text}")

        # Normalize plans list: it might be list or {plans: [...]}
        plans_list = None
        if isinstance(plans_json, list):
            plans_list = plans_json
        elif isinstance(plans_json, dict):
            # common keys that might hold list
            for key in ("plans", "data", "subscriptionPlans", "items"):
                if key in plans_json and isinstance(plans_json[key], list):
                    plans_list = plans_json[key]
                    break
            # if dict is actually a single plan object
            if plans_list is None and any(k in plans_json for k in ("id", "planId", "priceId")):
                plans_list = [plans_json]

        assert isinstance(plans_list, list) and len(plans_list) > 0, f"No subscription plans available to test success path. Response: {plans_json}"

        # 4) Extract a valid planId from the first plan
        first_plan = plans_list[0]
        plan_id = None
        if isinstance(first_plan, str):
            plan_id = first_plan
        elif isinstance(first_plan, dict):
            for key in ("id", "planId", "priceId", "stripePriceId", "price_id"):
                if key in first_plan and isinstance(first_plan[key], str) and first_plan[key]:
                    plan_id = first_plan[key]
                    break
            # sometimes the plan object might have nested stripe info
            if not plan_id:
                if "stripe" in first_plan and isinstance(first_plan["stripe"], dict):
                    for key in ("priceId", "stripePriceId", "id"):
                        if key in first_plan["stripe"] and isinstance(first_plan["stripe"][key], str):
                            plan_id = first_plan["stripe"][key]
                            break

        assert plan_id, f"Could not determine planId from plan object: {first_plan}"

        # 5) Success case: create checkout session with valid planId
        payload = {"planId": plan_id}
        r = session.post(create_session_url, json=payload, headers=auth_headers, timeout=TIMEOUT)
        assert r.status_code == 200, f"Expected 200 creating checkout session with valid planId, got {r.status_code}, body: {r.text}"

        # Response should contain checkout session info or redirect URL
        success_ok = False
        try:
            resp_json = r.json()
            # common success keys
            for key in ("url", "checkoutUrl", "checkout_session", "session", "checkoutSession", "redirectUrl"):
                if key in resp_json and resp_json[key]:
                    success_ok = True
                    break
            # sometimes session info might be nested under data
            if not success_ok and isinstance(resp_json.get("data"), dict):
                for key in ("url", "checkoutUrl", "sessionId", "checkoutSession"):
                    if key in resp_json["data"] and resp_json["data"][key]:
                        success_ok = True
                        break
        except ValueError:
            # non-JSON success response, check text for a URL
            if isinstance(r.text, str) and ("http://" in r.text or "https://" in r.text):
                success_ok = True

        assert success_ok, f"Checkout session response did not contain expected session or URL. Raw body: {r.text}"

        # 6) Error case: create checkout session with invalid planId
        invalid_payload = {"planId": f"invalid-{uuid.uuid4().hex}"}
        r = session.post(create_session_url, json=invalid_payload, headers=auth_headers, timeout=TIMEOUT)
        # Expect an error (non-200). Accept 4xx or 5xx but prefer 4xx for validation failure.
        assert r.status_code != 200, f"Expected non-200 for invalid planId, got 200 with body: {r.text}"
        # If JSON, expect some error/message field
        try:
            err_json = r.json()
            has_error_info = any(k in err_json for k in ("error", "message", "errors", "detail"))
            assert has_error_info or r.status_code >= 400, f"Invalid-plan response lacked error info: {err_json}"
        except ValueError:
            # non-JSON error body is acceptable as long as status is error
            assert r.status_code >= 400, f"Invalid-plan returned non-JSON body but status {r.status_code} is not an error: {r.text}"

    finally:
        # Attempt best-effort cleanup: logout to terminate session/cookies.
        try:
            # Use session so that any refresh cookie is sent
            session.post(logout_url, timeout=TIMEOUT)
        except Exception:
            pass


if __name__ == "__main__":
    try:
        test_post_payments_create_checkout_session_with_valid_plan()
        print("TC010 passed")
    except AssertionError as e:
        print("TC010 failed:", e)
        sys.exit(1)
    except Exception as ex:
        print("TC010 encountered an unexpected error:", ex)
        sys.exit(2)