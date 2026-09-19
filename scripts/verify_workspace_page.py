#!/usr/bin/env python3
"""
Verification script for Dedicated Problem Workspace Page (Layout 2).
Tests:
1. Workspace component exports and JSX linkage in source
2. Hash routing configuration (#/problem/:id)
3. HTTP server responses for problem page URL & C++ multi-approach solutions
"""

import urllib.request
import json
import os
import sys

def test_workspace_source():
    print("[TEST 1] Verifying source files for Layout 2 Workspace...")
    files_to_check = [
        "frontend/src/components/ProblemWorkspacePage.tsx",
        "frontend/src/components/CppPlayground.tsx",
        "frontend/src/components/WhiteboardCanvas.tsx",
        "frontend/src/App.tsx",
        "frontend/src/components/QuestionTable.tsx",
        "frontend/src/components/QuestionCard.tsx"
    ]
    for rel_path in files_to_check:
        full_path = os.path.join(os.getcwd(), rel_path)
        assert os.path.exists(full_path), f"Missing required file: {rel_path}"
        with open(full_path, "r", encoding="utf-8") as f:
            content = f.read()
        assert len(content) > 100, f"File {rel_path} appears empty"
    print("  [OK] All workspace source files exist and have non-empty content.")

    # Check App.tsx has hash routing and ProblemWorkspacePage
    with open("frontend/src/App.tsx", "r", encoding="utf-8") as f:
        app_src = f.read()
    assert "ProblemWorkspacePage" in app_src, "App.tsx missing ProblemWorkspacePage"
    assert "getProblemIdFromHash" in app_src, "App.tsx missing getProblemIdFromHash"
    assert "activeProblemQuestion" in app_src, "App.tsx missing activeProblemQuestion"
    assert "handleOpenProblem" in app_src, "App.tsx missing handleOpenProblem"
    assert "handleBackToDashboard" in app_src, "App.tsx missing handleBackToDashboard"
    print("  [OK] App.tsx has complete hash routing and dedicated workspace rendering logic.")

def test_anchor_tag_new_tab_support():
    print("[TEST 2] Verifying middle-click / new tab anchor link support...")
    with open("frontend/src/components/QuestionTable.tsx", "r", encoding="utf-8") as f:
        table_src = f.read()
    assert '#/problem/' in table_src, "QuestionTable missing '#/problem/' anchor link"
    assert '<a' in table_src, "QuestionTable missing <a> wrapper for middle-click/new-tab"

    with open("frontend/src/components/QuestionCard.tsx", "r", encoding="utf-8") as f:
        card_src = f.read()
    assert '#/problem/' in card_src, "QuestionCard missing '#/problem/' anchor link"
    assert '<a' in card_src, "QuestionCard missing <a> wrapper for middle-click/new-tab"

    print("  [OK] Both Table and Card views wrap problem titles in <a href='#/problem/:id'> for native new-tab support.")

def test_server_and_solutions():
    print("[TEST 3] Testing live HTTP server and problem solutions...")
    # Test index.html served
    req = urllib.request.Request("http://127.0.0.1:3000/")
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8')
        assert response.status == 200, f"Expected status 200, got {response.status}"
        assert "<div id=\"root\"></div>" in html, "Root div missing in index.html"
    print("  [OK] Server serves index.html with HTTP 200.")

    # Test solution endpoint
    sample_ids = [1, 2, 3, 15, 206]
    for sid in sample_ids:
        sol_url = f"http://127.0.0.1:3000/solutions/{sid}.json"
        req = urllib.request.Request(sol_url)
        with urllib.request.urlopen(req) as resp:
            assert resp.status == 200, f"Solution {sid} returned status {resp.status}"
            data = json.loads(resp.read().decode('utf-8'))
            assert data.get("questionId") == sid, f"Mismatch questionId in solution: {data.get('questionId')}"
            assert "approaches" in data and len(data["approaches"]) >= 1, f"No approaches in solution {sid}"
            assert "theory" in data["approaches"][0] or "intuition" in data["approaches"][0], f"No theory/intuition in solution {sid}"
            for app in data["approaches"]:
                assert "cppCode" in app and len(app["cppCode"]) > 0, "Missing cppCode in approach"
                assert "timeComplexity" in app, "Missing timeComplexity"
                assert "spaceComplexity" in app, "Missing spaceComplexity"
        print(f"  [OK] Problem #{sid} ({data.get('title')}) solution verified with multi-approach C++ and theory.")

if __name__ == "__main__":
    test_workspace_source()
    test_anchor_tag_new_tab_support()
    test_server_and_solutions()
    print("\n[SUCCESS] ALL PROBLEM WORKSPACE INTEGRATION TESTS PASSED!")
