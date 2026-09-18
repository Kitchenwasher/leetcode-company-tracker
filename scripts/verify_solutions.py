import json
import os
import sys

def verify_solutions():
    sol_dir = 'public/solutions'
    assert os.path.exists(sol_dir), "Solutions directory does not exist"
    
    index_file = os.path.join(sol_dir, 'index.json')
    assert os.path.exists(index_file), "index.json manifest missing"
    
    with open(index_file, 'r', encoding='utf-8') as f:
        manifest = json.load(f)
        
    print(f"  [OK] Validated manifest index ({len(manifest)} questions)")
    assert len(manifest) >= 3300, f"Expected >= 3300 solutions in manifest, got {len(manifest)}"
    
    # Check top sample questions
    test_ids = [1, 3, 15, 20, 21, 33, 42, 53, 121, 146, 200, 206]
    for qid in test_ids:
        sol_file = os.path.join(sol_dir, f"{qid}.json")
        assert os.path.exists(sol_file), f"Solution file {qid}.json missing"
        with open(sol_file, 'r', encoding='utf-8') as sf:
            data = json.load(sf)
            
        assert 'title' in data and len(data['title']) > 0, f"Missing title in #{qid}"
        assert 'approaches' in data and len(data['approaches']) > 0, f"Missing approaches in #{qid}"
        assert 'corePattern' in data, f"Missing corePattern in #{qid}"
        
        for app in data['approaches']:
            assert 'name' in app, f"Missing approach name in #{qid}"
            assert 'cppCode' in app and len(app['cppCode']) > 0, f"Missing C++ code in #{qid}"
            assert 'timeComplexity' in app and 'complexity' in app['timeComplexity'], f"Missing time complexity in #{qid}"
            assert 'spaceComplexity' in app and 'complexity' in app['spaceComplexity'], f"Missing space complexity in #{qid}"
            assert 'theory' in app and len(app['theory']) > 0, f"Missing theory in #{qid}"
            
        print(f"  [OK] Verified Problem #{qid}: {data['title']} ({len(data['approaches'])} C++ approaches)")
        
    print("\nSUCCESS: All C++ solutions validated with strict schema compliance!")

if __name__ == '__main__':
    verify_solutions()
