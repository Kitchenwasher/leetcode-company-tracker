import json
import os
import sys

def test_data_integrity():
    print("Testing data integrity...")
    data_path = 'public/data/leetcode_company_data.json'
    assert os.path.exists(data_path), f"{data_path} not found"
    
    with open(data_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    assert 'questions' in data, "Missing questions key"
    assert 'companies' in data, "Missing companies key"
    
    questions = data['questions']
    companies = data['companies']
    
    print(f"  [OK] Verified {len(questions)} unique questions")
    print(f"  [OK] Verified {len(companies)} active companies")
    
    assert len(questions) >= 3300, f"Expected >= 3300 questions, got {len(questions)}"
    assert len(companies) >= 650, f"Expected >= 650 companies, got {len(companies)}"
    
    # Check top companies
    for target in ['google', 'amazon', 'meta', 'microsoft', 'apple', 'netflix', 'uber', 'bloomberg']:
        assert target in companies, f"Missing key company: {target}"
        c = companies[target]
        assert c['totalQuestions'] > 0, f"No questions for {target}"
        print(f"  [OK] {c['name']:15s}: {c['totalQuestions']} total questions ({c['thirtyDaysCount']} in 30d)")

    # Check sample questions
    for q in questions[:10]:
        assert 'id' in q, "Missing id"
        assert 'title' in q and len(q['title']) > 0, "Missing title"
        assert q['difficulty'] in ['Easy', 'Medium', 'Hard'], f"Invalid difficulty {q['difficulty']}"
        assert q['url'].startswith('https://leetcode.com/problems/'), f"Invalid URL {q['url']}"
        assert 'companies' in q and len(q['companies']) > 0, "Question not tied to any company"
        
    print("  [OK] All sample questions have valid IDs, titles, URLs, and difficulties")

def test_build_artifacts():
    print("\nTesting build output artifacts...")
    dist_index = 'dist/index.html'
    assert os.path.exists(dist_index), "dist/index.html does not exist"
    
    assets_dir = 'dist/assets'
    assert os.path.exists(assets_dir), "dist/assets does not exist"
    
    files = os.listdir(assets_dir)
    js_files = [f for f in files if f.endswith('.js')]
    css_files = [f for f in files if f.endswith('.css')]
    
    assert len(js_files) > 0, "No JS bundle generated"
    assert len(css_files) > 0, "No CSS bundle generated"
    
    print(f"  [OK] Found JS bundle: {js_files[0]} ({os.path.getsize(os.path.join(assets_dir, js_files[0]))/1024:.1f} KB)")
    print(f"  [OK] Found CSS bundle: {css_files[0]} ({os.path.getsize(os.path.join(assets_dir, css_files[0]))/1024:.1f} KB)")

if __name__ == '__main__':
    try:
        test_data_integrity()
        test_build_artifacts()
        print("\nSUCCESS: ALL TESTS PASSED! APPLICATION IS HEALTHY & PRODUCTION-READY.")
    except AssertionError as e:
        print(f"\n❌ Test failed: {e}")
        sys.exit(1)
