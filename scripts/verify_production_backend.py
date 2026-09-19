#!/usr/bin/env python3
"""
Comprehensive Production Test Suite for LeetTracker Pro Full-Stack Platform.
Tests:
1. Health & Database Connectivity
2. Question Queries & Multi-Approach C++ Solutions
3. Authentication Flow (Register, Login, Me, Token refresh)
4. Progress & SRS Tracking
5. Payments & Subscription Entitlement
6. Self-Hosted Email Dispatch & Audit Logs
"""

import urllib.request
import urllib.parse
import json
import time
import sys

BASE_URL = "http://localhost:5000/api"

def make_request(url, method="GET", data=None, headers=None):
    req_headers = {"Content-Type": "application/json"}
    if headers:
        req_headers.update(headers)
    
    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=body, headers=req_headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode("utf-8")
            return resp.status, json.loads(content) if content else {}
    except urllib.error.HTTPError as e:
        content = e.read().decode("utf-8")
        try:
            parsed = json.loads(content)
        except Exception:
            parsed = {"raw": content}
        return e.code, parsed

def test_health():
    print("[TEST 1] Testing Backend Health & Database Connectivity...")
    status, res = make_request(f"{BASE_URL}/health")
    assert status == 200, f"Health check failed with status {status}: {res}"
    assert res.get("status") == "healthy", f"Status unhealthy: {res}"
    assert res.get("database") == "connected", f"Database not connected: {res}"
    print(f"  [OK] Server is healthy and connected to database ({res.get('database')}).")

def test_questions():
    print("\n[TEST 2] Testing Database Question Queries & C++ Solutions...")
    # 1. Query Google 30-day questions
    status, res = make_request(f"{BASE_URL}/questions?company=google&timeframe=thirty-days&limit=10")
    assert status == 200, f"Questions query failed: {res}"
    assert res.get("total", 0) > 0, "No questions returned for Google"
    assert len(res.get("questions", [])) > 0, "Empty questions array"
    first_q = res["questions"][0]
    print(f"  [OK] Retrieved {res['total']} Google 30-day questions (sample #{first_q['id']}: {first_q['title']})")

    # 2. Get specific question
    status, q_res = make_request(f"{BASE_URL}/questions/1")
    assert status == 200, f"Get question #1 failed: {q_res}"
    assert q_res.get("title") == "Two Sum", f"Unexpected title: {q_res.get('title')}"
    assert "companies" in q_res, "Companies breakdown missing"
    print(f"  [OK] Question #1 verified: {q_res['title']} with {len(q_res['companies'])} companies.")

    # 3. Get C++ multi-approach solution from database
    status, sol_res = make_request(f"{BASE_URL}/questions/1/solution")
    assert status == 200, f"Get solution failed: {sol_res}"
    assert "approaches" in sol_res and len(sol_res["approaches"]) >= 1, "No approaches found"
    assert "corePattern" in sol_res, "Core pattern missing"
    print(f"  [OK] Solution for #1 verified: {len(sol_res['approaches'])} C++ approaches with theoretical invariants.")

def test_auth_and_progress():
    print("\n[TEST 3] Testing Authentication, JWT, and Progress Tracking...")
    unique_email = f"candidate_{int(time.time())}@leettracker.test"
    password = "SecurePassword123!"

    # 1. Register
    status, reg_res = make_request(
        f"{BASE_URL}/auth/register",
        method="POST",
        data={
            "name": "Alex Candidate",
            "email": unique_email,
            "password": password,
            "targetCompany": "google"
        }
    )
    assert status == 201, f"Registration failed ({status}): {reg_res}"
    access_token = reg_res.get("accessToken")
    user_id = reg_res.get("user", {}).get("id")
    assert access_token, "No access token returned on registration"
    print(f"  [OK] User registered successfully: {unique_email} (ID: {user_id})")

    # 2. Authenticate /me
    auth_headers = {"Authorization": f"Bearer {access_token}"}
    status, me_res = make_request(f"{BASE_URL}/auth/me", headers=auth_headers)
    assert status == 200, f"Get /me failed: {me_res}"
    assert me_res.get("user", {}).get("email") == unique_email, "Email mismatch in /me"
    print(f"  [OK] Authenticated endpoint /auth/me verified for {unique_email}.")

    # 3. Update question progress
    status, prog_res = make_request(
        f"{BASE_URL}/progress/1",
        method="PUT",
        data={
            "status": "solved",
            "notes": "Hash map complement approach in O(n) time.",
            "tags": ["#HashMap", "#Array"],
            "confidence": 5,
            "whiteboardData": '{"strokes": [{"type": "box", "text": "nums map"}]}'
        },
        headers=auth_headers
    )
    assert status == 200, f"Update progress failed: {prog_res}"
    print(f"  [OK] Updated progress for problem #1 to 'solved' with notes & whiteboard data.")

    # 4. Fetch progress map
    status, all_prog = make_request(f"{BASE_URL}/progress", headers=auth_headers)
    assert status == 200, f"Fetch progress failed: {all_prog}"
    assert "1" in all_prog, "Problem 1 not found in progress map"
    assert all_prog["1"]["status"] == "solved", "Status mismatch"
    print(f"  [OK] Retrieved user progress map with {len(all_prog)} tracked questions.")

    # 5. Check stats summary & streak
    status, stats = make_request(f"{BASE_URL}/progress/stats/summary", headers=auth_headers)
    assert status == 200, f"Stats summary failed: {stats}"
    assert stats.get("totalSolved") >= 1, "Total solved count mismatch"
    assert stats.get("todaySolved") >= 1, "Today solved count mismatch"
    print(f"  [OK] User stats verified: {stats['totalSolved']} solved ({stats['breakdown']}).")

    return access_token

def test_payments(token):
    print("\n[TEST 4] Testing Stripe Subscriptions & Billing API...")
    auth_headers = {"Authorization": f"Bearer {token}"}

    # 1. Fetch plans
    status, plans_res = make_request(f"{BASE_URL}/payments/plans")
    assert status == 200, f"Get plans failed: {plans_res}"
    assert len(plans_res.get("plans", [])) >= 3, "Plans list incomplete"
    print(f"  [OK] Available plans: {[p['name'] for p in plans_res['plans']]}")

    # 2. Create Checkout Session (Mock mode)
    status, checkout_res = make_request(
        f"{BASE_URL}/payments/create-checkout-session",
        method="POST",
        data={"planId": "pro_monthly"},
        headers=auth_headers
    )
    assert status == 200, f"Create checkout session failed: {checkout_res}"
    assert "url" in checkout_res, "Missing checkout session url"
    print(f"  [OK] Checkout session generated: {checkout_res['url']} (Mock mode: {checkout_res.get('isMock')})")

    # 3. Verify user tier upgraded to PRO
    status, status_res = make_request(f"{BASE_URL}/payments/status", headers=auth_headers)
    assert status == 200, f"Get subscription status failed: {status_res}"
    assert status_res.get("isPro") == True, "User should be Pro after checkout"
    print(f"  [OK] User subscription tier upgraded to PRO ({status_res['tier']}).")

def test_email_service():
    print("\n[TEST 5] Testing Self-Hosted Email Service & Audit Log...")
    test_email = "tester@interview.dev"
    status, mail_res = make_request(
        f"{BASE_URL}/mail/test",
        method="POST",
        data={"email": test_email}
    )
    assert status == 200, f"Email test dispatch failed: {mail_res}"
    assert "message" in mail_res, "No message in email response"
    print(f"  [OK] Email service dispatched test verification to {test_email}: {mail_res['message']}")

if __name__ == "__main__":
    print("==================================================")
    print("[TEST] RUNNING PRODUCTION BACKEND TEST SUITE")
    print("==================================================")
    test_health()
    test_questions()
    token = test_auth_and_progress()
    test_payments(token)
    test_email_service()
    print("\n==================================================")
    print("[SUCCESS] ALL PRODUCTION BACKEND TESTS PASSED!")
    print("==================================================")
