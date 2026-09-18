import os
import csv
import json

REPO_DIR = 'repo_data'
OUTPUT_DATA_DIR = 'public/data'
OUTPUT_SRC_DIR = 'src/data'

os.makedirs(OUTPUT_DATA_DIR, exist_ok=True)
os.makedirs(OUTPUT_SRC_DIR, exist_ok=True)

# Curated high-profile lists
BLIND_75_IDS = {
    1, 3, 5, 11, 15, 19, 20, 21, 23, 33, 39, 48, 53, 54, 55, 56, 57, 62, 70, 73,
    76, 79, 91, 98, 100, 102, 104, 105, 121, 124, 125, 128, 133, 139, 141, 143,
    152, 153, 190, 191, 198, 200, 206, 207, 208, 211, 212, 213, 217, 226, 230,
    235, 238, 242, 252, 253, 261, 268, 269, 295, 297, 300, 322, 323, 338, 347,
    371, 417, 424, 435, 572, 647, 1143
}

GRIND_169_IDS = BLIND_75_IDS | {
    8, 13, 14, 17, 22, 36, 42, 46, 49, 67, 74, 75, 78, 84, 94, 101, 108, 110, 127,
    134, 136, 146, 150, 155, 169, 179, 199, 202, 210, 215, 221, 227, 232, 234, 236,
    239, 240, 278, 283, 287, 310, 328, 329, 380, 383, 394, 409, 416, 438, 525, 542,
    543, 560, 621, 658, 662, 692, 704, 721, 733, 739, 787, 844, 875, 876, 973, 981,
    994, 1091, 1235, 1448, 1730
}

# Company Tier classification
TIER_FAANG = {'google', 'meta', 'amazon', 'apple', 'microsoft', 'netflix'}
TIER_FINTECH = {'bloomberg', 'goldman-sachs', 'citadel', 'de-shaw', 'two-sigma', 'jane-street', 'paypal', 'visa', 'mastercard', 'morgan-stanley', 'jpmorgan', 'stripe', 'square', 'robinhood'}
TIER_UNICORNS = {'uber', 'bytedance', 'tiktok', 'snowflake', 'databricks', 'airbnb', 'door-dash', 'doordash', 'lyft', 'pinterest', 'snapchat', 'reddit', 'spotify', 'coinbase', 'instacart', 'roblox', 'figma'}
TIER_BIGTECH = {'salesforce', 'oracle', 'adobe', 'cisco', 'nvidia', 'intel', 'ibm', 'qualcomm', 'linkedin', 'twitter', 'x', 'walmart-labs', 'ebay', 'intuit', 'atlassian', 'service-now', 'vmware', 'yahoo', 'yandex'}

def infer_topics(title):
    t = title.lower()
    topics = []
    if any(k in t for k in ['sum', 'array', 'subarray', 'matrix', 'duplicate', 'rotate', 'product', 'intervals']):
        topics.append('Arrays & Hashing')
    if any(k in t for k in ['string', 'palindrome', 'anagram', 'parentheses', 'substring', 'word', 'roman', 'regex']):
        topics.append('Strings')
    if any(k in t for k in ['two sum', '3sum', 'water', 'pointer', 'trap', 'sort colors', 'remove duplicates']):
        topics.append('Two Pointers')
    if any(k in t for k in ['window', 'longest substring', 'minimum window', 'sliding']):
        topics.append('Sliding Window')
    if any(k in t for k in ['tree', 'bst', 'binary tree', 'traversal', 'depth', 'path sum', 'invert', 'ancestor', 'subtree']):
        topics.append('Trees')
    if any(k in t for k in ['graph', 'island', 'course', 'clone', 'network', 'bipartite', 'connected', 'dijkstra']):
        topics.append('Graphs')
    if any(k in t for k in ['dynamic', 'dp', 'coin change', 'climbing stairs', 'robber', 'longest increasing', 'knapsack', 'edit distance', 'decode ways']):
        topics.append('Dynamic Programming')
    if any(k in t for k in ['binary search', 'search in', 'median', 'peak', 'koko', 'first bad', 'guess']):
        topics.append('Binary Search')
    if any(k in t for k in ['stack', 'queue', 'parentheses', 'rpn', 'daily temperatures', 'largest rectangle', 'monotone']):
        topics.append('Stack & Queue')
    if any(k in t for k in ['linked list', 'reverse linked', 'merge two', 'reorder', 'cycle', 'copy list', 'lru cache']):
        topics.append('Linked List')
    if any(k in t for k in ['heap', 'priority', 'kth largest', 'k closest', 'top k', 'median from data stream', 'task scheduler']):
        topics.append('Heap & Priority Queue')
    if any(k in t for k in ['backtrack', 'permutation', 'combination', 'subsets', 'n-queens', 'word search', 'sudoku', 'palindrome partitioning']):
        topics.append('Backtracking')
    if any(k in t for k in ['trie', 'prefix', 'word search ii', 'design add']):
        topics.append('Trie')
    if any(k in t for k in ['greedy', 'jump game', 'gas station', 'candy', 'assign cookies', 'partition labels']):
        topics.append('Greedy')
    if any(k in t for k in ['bit', 'bits', 'hamming', 'reverse bits', 'single number']):
        topics.append('Bit Manipulation')
    if any(k in t for k in ['math', 'prime', 'pow', 'sqrt', 'reverse integer', 'factorial', 'geometry']):
        topics.append('Math & Geometry')
    
    if not topics:
        topics.append('Algorithms')
    return topics

def main():
    print("Parsing repository data...")
    all_questions = {}
    companies_meta = {}
    company_names = sorted([d for d in os.listdir(REPO_DIR) if os.path.isdir(os.path.join(REPO_DIR, d)) and not d.startswith('.')])
    
    for company in company_names:
        c_path = os.path.join(REPO_DIR, company)
        timeframes = {}
        tf_counts = {'thirty-days': 0, 'three-months': 0, 'six-months': 0, 'more-than-six-months': 0, 'all': 0}
        diff_counts = {'Easy': 0, 'Medium': 0, 'Hard': 0}
        
        for tf_file in ['thirty-days.csv', 'three-months.csv', 'six-months.csv', 'more-than-six-months.csv', 'all.csv']:
            filepath = os.path.join(c_path, tf_file)
            if not os.path.exists(filepath):
                continue
            tf_name = tf_file[:-4]
            try:
                with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        qid_raw = row.get('ID', '').strip()
                        if not qid_raw:
                            continue
                        qid = int(qid_raw) if qid_raw.isdigit() else qid_raw
                        title = row.get('Title', '').strip()
                        url = row.get('URL', '').strip()
                        diff = row.get('Difficulty', 'Medium').strip().capitalize()
                        if diff not in ['Easy', 'Medium', 'Hard']:
                            diff = 'Medium'
                        acc = row.get('Acceptance %', '50.0%').strip()
                        freq = row.get('Frequency %', '0.0%').strip()
                        
                        tf_counts[tf_name] += 1
                        if tf_name == 'all':
                            diff_counts[diff] += 1
                            
                        if qid not in all_questions:
                            topics = infer_topics(title)
                            is_b75 = qid in BLIND_75_IDS if isinstance(qid, int) else False
                            is_g169 = qid in GRIND_169_IDS if isinstance(qid, int) else False
                            
                            all_questions[qid] = {
                                'id': qid,
                                'title': title,
                                'url': url,
                                'difficulty': diff,
                                'acceptance': acc,
                                'topics': topics,
                                'isBlind75': is_b75,
                                'isGrind169': is_g169,
                                'companies': {}
                            }
                            
                        if company not in all_questions[qid]['companies']:
                            all_questions[qid]['companies'][company] = {}
                        all_questions[qid]['companies'][company][tf_name] = freq
            except Exception as e:
                print(f"Error reading {filepath}: {e}")
                
        total_q = tf_counts['all'] or sum(tf_counts.values())
        if total_q > 0:
            # Determine tier
            tier = 'Other'
            c_lower = company.lower()
            if c_lower in TIER_FAANG:
                tier = 'FAANG'
            elif c_lower in TIER_FINTECH:
                tier = 'FinTech & Quant'
            elif c_lower in TIER_UNICORNS:
                tier = 'Top Unicorns'
            elif c_lower in TIER_BIGTECH:
                tier = 'Big Tech'
            elif total_q >= 50:
                tier = 'Popular (50+)'
                
            companies_meta[company] = {
                'id': company,
                'name': company.replace('-', ' ').title(),
                'tier': tier,
                'totalQuestions': total_q,
                'thirtyDaysCount': tf_counts['thirty-days'],
                'threeMonthsCount': tf_counts['three-months'],
                'sixMonthsCount': tf_counts['six-months'],
                'allCount': tf_counts['all'],
                'diffCounts': diff_counts
            }

    print(f"Processed {len(all_questions)} unique questions across {len(companies_meta)} companies.")

    # Convert questions map to list for easier frontend filtering & sorting
    questions_list = list(all_questions.values())
    
    # Sort by ID
    questions_list.sort(key=lambda x: x['id'] if isinstance(x['id'], int) else 999999)

    # Export main dataset
    output_path = os.path.join(OUTPUT_DATA_DIR, 'leetcode_company_data.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump({
            'updatedAt': 'July 2026',
            'totalQuestions': len(questions_list),
            'totalCompanies': len(companies_meta),
            'companies': companies_meta,
            'questions': questions_list
        }, f, separators=(',', ':'))
        
    print(f"Written dataset to {output_path} ({os.path.getsize(output_path) / (1024*1024):.2f} MB)")

    # Export lightweight company metadata for instant UI bootstrapping
    company_meta_path = os.path.join(OUTPUT_SRC_DIR, 'company_meta.json')
    with open(company_meta_path, 'w', encoding='utf-8') as f:
        json.dump(companies_meta, f, indent=2)
    print(f"Written company meta to {company_meta_path}")

if __name__ == '__main__':
    main()
