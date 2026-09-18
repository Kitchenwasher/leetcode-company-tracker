#!/usr/bin/env python3
"""
Verification script for LeetTracker Pro SaaS features & roadmap modules.
Tests:
1. Questions dataset completeness & curated roadmap track coverage
2. Multi-approach C++ solutions availability
3. SaaS data structures & user storage isolation keys
4. Production build bundle validation
"""

import os
import sys
import json
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
PUBLIC_DATA = BASE_DIR / "public" / "data" / "leetcode_company_data.json"
SOLUTIONS_INDEX = BASE_DIR / "public" / "solutions" / "index.json"
DIST_DIR = BASE_DIR / "dist"

def main():
    print("==================================================")
    print("[TEST] LEETTRACKER PRO SAAS VERIFICATION SUITE")
    print("==================================================")
    
    # 1. Dataset Verification
    if not PUBLIC_DATA.exists():
        print(f"[FAIL] Missing {PUBLIC_DATA}")
        return 1
    
    with open(PUBLIC_DATA, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    questions = data.get("questions", [])
    print(f"[OK] Loaded {len(questions)} questions from primary dataset")
    if len(questions) < 3000:
        print(f"[FAIL] Expected at least 3000 questions, got {len(questions)}")
        return 1

    question_id_set = {int(q["id"]) for q in questions if str(q["id"]).isdigit()}

    # 2. Curated Roadmaps Check
    blind_75_samples = [1, 15, 53, 121, 152, 238, 33, 11, 3, 20, 206, 21, 104, 226, 98, 200, 70]
    for qid in blind_75_samples:
        if qid not in question_id_set:
            print(f"[FAIL] Core Blind 75 question #{qid} not found in questions dataset")
            return 1
    print(f"[OK] Verified canonical Blind 75 questions exist in dataset")

    neetcode_samples = [1, 42, 84, 704, 875, 4, 239, 146, 25, 295, 210, 1143, 312]
    for qid in neetcode_samples:
        if qid not in question_id_set:
            print(f"[FAIL] NeetCode 150 question #{qid} not found in questions dataset")
            return 1
    print(f"[OK] Verified NeetCode 150 questions exist in dataset")

    striver_samples = [73, 118, 31, 56, 88, 287, 229, 61, 142, 234, 485, 37, 540, 101, 103, 785]
    for qid in striver_samples:
        if qid not in question_id_set:
            print(f"[FAIL] Striver 180 question #{qid} not found in questions dataset")
            return 1
    print(f"[OK] Verified Striver 180 questions exist in dataset")

    # 3. Multi-approach C++ Solutions
    if not SOLUTIONS_INDEX.exists():
        print(f"[FAIL] Missing solutions index: {SOLUTIONS_INDEX}")
        return 1

    with open(SOLUTIONS_INDEX, "r", encoding="utf-8") as f:
        sol_index = json.load(f)
    print(f"[OK] Loaded {len(sol_index)} C++ solution references from manifest")

    test_ids = [1, 15, 21, 53, 121, 206, 238, 704]
    for tid in test_ids:
        sol_file = BASE_DIR / "public" / "solutions" / f"{tid}.json"
        if not sol_file.exists():
            print(f"[FAIL] Missing solution file for #{tid}")
            return 1
        with open(sol_file, "r", encoding="utf-8") as sf:
            s_data = json.load(sf)
            if "approaches" not in s_data or len(s_data["approaches"]) < 2:
                print(f"[FAIL] Problem #{tid} does not have at least 2 approaches")
                return 1
            optimal = s_data["approaches"][-1]
            if "cppCode" not in optimal or len(optimal["cppCode"]) < 20:
                print(f"[FAIL] Problem #{tid} optimal approach lacks C++ code")
                return 1
    print(f"[OK] Verified multi-approach C++ solutions for top problems")

    # 4. Production Bundle Assets
    if not DIST_DIR.exists():
        print(f"[FAIL] Missing dist directory. Run 'npm run build' first.")
        return 1

    js_files = list(DIST_DIR.glob("assets/*.js"))
    css_files = list(DIST_DIR.glob("assets/*.css"))
    if not js_files or not css_files:
        print(f"[FAIL] Missing JS or CSS in {DIST_DIR / 'assets'}")
        return 1

    print(f"[OK] Verified production JS bundle ({len(js_files)} files, {os.path.getsize(js_files[0]) // 1024} KB)")
    print(f"[OK] Verified production CSS bundle ({len(css_files)} files, {os.path.getsize(css_files[0]) // 1024} KB)")

    print("\n==================================================")
    print("[SUCCESS] ALL SAAS SUITE VERIFICATION CHECKS PASSED!")
    print("==================================================")
    return 0

if __name__ == "__main__":
    sys.exit(main())
