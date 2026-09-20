import os
import json
import time
import urllib.request
import urllib.error

SOLUTIONS_DIR = 'frontend/public/solutions'
DATA_FILE = 'frontend/public/data/leetcode_company_data.json'
os.makedirs(SOLUTIONS_DIR, exist_ok=True)

MUSE_API_KEY = os.environ.get('MUSE_API_KEY', 'LLM_1611329520586286_g-veMmNkfLODJLJu3eUWqyCJEv4')
MUSE_API_URL = os.environ.get('MUSE_API_URL', 'https://api.meta.ai/v1/chat/completions')
MUSE_MODEL = os.environ.get('MUSE_MODEL', 'muse-spark-1.3-contributor')

def generate_solution_for_question(q):
    qid = q['id']
    title = q['title']
    diff = q['difficulty']
    topics = q.get('topics', ['Algorithms'])

    print(f"Generating solution for #{qid}: {title} ({diff})...")

    system_prompt = """You are a Principal Software Engineer and Staff Interviewer at Google and Meta.
Your job is to write the absolute gold-standard, FAANG-caliber LeetCode solution editorial for the requested problem.

Requirements:
1. Provide 2 to 3 distinct approaches starting with Approach 1 (Brute Force / Naive baseline) progressing to the Optimal FAANG Production Approach.
2. For EVERY approach, provide clean, idiomatic, compilable code matching the exact LeetCode method signature in THREE languages:
   - C++ (C++17/20 with necessary includes)
   - Python 3 (clean type-hinted code)
   - Java (clean Solution class)
3. For EVERY approach, include:
   - Intuition: Step-by-step thinking of how the insight is discovered.
   - Theory: Algorithmic proof, loop invariants, or recurrence relations.
   - Exact Time Complexity with Big-O and mathematical justification.
   - Exact Space Complexity with Big-O and explanation.
   - Realistic Dry-Run Trace on sample test cases.
   - Edge Cases & Common Traps (empty, single-element, integer overflow, negative, duplicates).
4. Provide 3 high-impact FAANG Interview Tips (clarifying questions to ask the interviewer, trade-offs to state).

Output format: You MUST respond ONLY with a single valid, raw JSON object (no introductory text)."""

    user_prompt = f"""Generate a master-level multi-approach solution for:
Problem #{qid}: {title}
Difficulty: {diff}
Topics: {', '.join(topics)}

Return JSON adhering strictly to this schema:
{{
  "corePattern": "string (e.g. Monotonic Stack, Two Pointers with Invariant, BFS Wavefront)",
  "interviewTips": ["tip 1", "tip 2", "tip 3"],
  "approaches": [
    {{
      "id": "brute-force",
      "name": "Approach 1: Brute Force (Naive Baseline)",
      "tag": "Brute Force",
      "intuition": "detailed intuition...",
      "theory": "algorithmic theory and proof...",
      "code": {{
        "cpp": "#include ... class Solution {{ ... }};",
        "python": "class Solution:\\n    def ...",
        "java": "class Solution {{\\n    public ...\\n}}"
      }},
      "timeComplexity": {{
        "complexity": "O(...)",
        "explanation": "derivation..."
      }},
      "spaceComplexity": {{
        "complexity": "O(...)",
        "explanation": "derivation..."
      }},
      "dryRunExample": {{
        "input": "...",
        "steps": ["step 1...", "step 2..."],
        "output": "..."
      }},
      "edgeCases": ["case 1...", "case 2..."]
    }},
    {{
      "id": "optimal",
      "name": "Approach 2: Optimal ...",
      "tag": "Optimal",
      "intuition": "...",
      "theory": "...",
      "code": {{
        "cpp": "...",
        "python": "...",
        "java": "..."
      }},
      "timeComplexity": {{
        "complexity": "O(...)",
        "explanation": "..."
      }},
      "spaceComplexity": {{
        "complexity": "O(...)",
        "explanation": "..."
      }},
      "dryRunExample": {{
        "input": "...",
        "steps": ["..."],
        "output": "..."
      }},
      "edgeCases": ["..."]
    }}
  ]
}}"""

    payload = json.dumps({
        'model': MUSE_MODEL,
        'messages': [
            {'role': 'system', 'content': system_prompt},
            {'role': 'user', 'content': user_prompt}
        ],
        'max_tokens': 6500,
        'temperature': 0.2
    }).encode('utf-8')

    req = urllib.request.Request(
        MUSE_API_URL,
        data=payload,
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {MUSE_API_KEY}'
        }
    )

    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            raw_content = data['choices'][0]['message']['content']
            
            cleaned = raw_content.strip()
            if cleaned.startswith('```'):
                cleaned = cleaned.split('\n', 1)[1].rsplit('```', 1)[0]
            
            parsed = json.loads(cleaned)
            
            # Format and normalize approaches
            formatted_approaches = []
            for idx, app in enumerate(parsed.get('approaches', [])):
                code_obj = app.get('code', {})
                cpp = code_obj.get('cpp') or app.get('cppCode') or ''
                formatted_approaches.append({
                    'id': app.get('id', f'approach-{idx+1}'),
                    'name': app.get('name', f'Approach {idx+1}'),
                    'tag': app.get('tag', 'Optimal' if idx == len(parsed['approaches'])-1 else 'Brute Force'),
                    'intuition': app.get('intuition', ''),
                    'theory': app.get('theory', ''),
                    'cppCode': cpp,
                    'code': {
                        'cpp': cpp,
                        'python': code_obj.get('python', ''),
                        'java': code_obj.get('java', '')
                    },
                    'timeComplexity': app.get('timeComplexity', {'complexity': 'O(N)', 'explanation': 'Linear.'}),
                    'spaceComplexity': app.get('spaceComplexity', {'complexity': 'O(1)', 'explanation': 'Constant.'}),
                    'dryRunExample': app.get('dryRunExample'),
                    'edgeCases': app.get('edgeCases', [])
                })
            
            solution_obj = {
                'questionId': qid,
                'title': title,
                'difficulty': diff,
                'corePattern': parsed.get('corePattern', 'Algorithmic Pattern & Invariant'),
                'interviewTips': parsed.get('interviewTips', []),
                'approaches': formatted_approaches
            }
            
            # Save to frontend/public/solutions
            out_path = os.path.join(SOLUTIONS_DIR, f"{qid}.json")
            with open(out_path, 'w', encoding='utf-8') as f:
                json.dump(solution_obj, f, indent=2)
                
            print(f"   [SUCCESS] Wrote #{qid} with {len(formatted_approaches)} approaches to {out_path}")
            return solution_obj

    except Exception as e:
        print(f"   [ERROR] Failed to generate #{qid}: {e}")
        return None

def main():
    print(f"Loading questions from {DATA_FILE}...")
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    questions = data.get('questions', [])
    q_by_id = {q['id']: q for q in questions}

    # Top high-yield FAANG & Blind 75 questions to generate first
    target_ids = [1, 3, 11, 15, 20, 21, 33, 42, 53, 56, 70, 121, 141, 146, 200, 206, 226, 238]

    print(f"Starting batch generation for {len(target_ids)} core FAANG questions...")
    for qid in target_ids:
        q = q_by_id.get(qid)
        if not q:
            continue
        generate_solution_for_question(q)
        time.sleep(1) # respectful pacing

    print("\nBatch generation complete!")

if __name__ == '__main__':
    main()
