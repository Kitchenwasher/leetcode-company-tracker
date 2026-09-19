import requests
import uuid
import sys
import traceback

BASE_URL = "http://localhost:5000"
TIMEOUT = 30

def test_get_question_by_id_TC004():
    session = requests.Session()
    created_id = None
    created_via_post = False

    def extract_id_from_response(json_obj):
        if not isinstance(json_obj, dict):
            return None
        # common top-level id keys
        for k in ("id", "_id", "questionId", "question_id", "uuid"):
            if k in json_obj:
                return json_obj[k]
        # sometimes the created object is nested under 'data' or 'result'
        for container in ("data", "result", "question"):
            if container in json_obj and isinstance(json_obj[container], dict):
                for k in ("id", "_id", "questionId", "question_id", "uuid"):
                    if k in json_obj[container]:
                        return json_obj[container][k]
                # if the nested object itself looks like the resource, return its id if present
                nested = json_obj[container]
                if "id" in nested:
                    return nested["id"]
        # fallback: if response looks like the resource (has title), but no id key, try common key 'id'
        return None

    try:
        # Attempt to create a new question resource so we have a valid ID to test against.
        create_url = f"{BASE_URL}/api/questions"
        unique_suffix = str(uuid.uuid4())[:8]
        payload = {
            "title": f"TC004 Test Question {unique_suffix}",
            "slug": f"tc004-test-question-{unique_suffix}",
            "difficulty": "Medium",
            "tags": ["Arrays", "Two Pointers"],
            "companies": ["Google", "Amazon"],
            "description": "Automatically created test question for TC004"
        }
        headers = {"Content-Type": "application/json"}

        try:
            resp = session.post(create_url, json=payload, headers=headers, timeout=TIMEOUT)
        except requests.RequestException as e:
            raise AssertionError(f"Failed to POST to {create_url}: {e}")

        if resp.status_code in (200, 201):
            try:
                body = resp.json()
            except ValueError:
                raise AssertionError(f"POST {create_url} returned {resp.status_code} but no JSON body")
            created_id = extract_id_from_response(body)
            if not created_id:
                # maybe the API returns the full resource in a list or contains the id under different structure
                # attempt best-effort extraction: if body is the resource itself and contains 'title', assume creation succeeded but no id returned
                if isinstance(body, dict) and body.get("title") == payload["title"]:
                    # attempt to find an 'id' or '_id' anyway
                    created_id = body.get("id") or body.get("_id")
            if not created_id:
                # treat as creation failed for id retrieval; fall back to listing endpoint
                created_id = None
            else:
                created_via_post = True
        else:
            # If creation not allowed or failed, attempt to fetch an existing question from list endpoint
            # This supports APIs where questions are pre-seeded and creation is not exposed.
            list_url = f"{BASE_URL}/api/questions"
            try:
                list_resp = session.get(list_url, timeout=TIMEOUT)
            except requests.RequestException as e:
                raise AssertionError(f"Failed to GET {list_url}: {e}")
            if list_resp.status_code != 200:
                raise AssertionError(f"Unable to create or list questions. POST {create_url} -> {resp.status_code}. GET {list_url} -> {list_resp.status_code}")
            try:
                list_body = list_resp.json()
            except ValueError:
                raise AssertionError(f"GET {list_url} returned {list_resp.status_code} but no JSON body")
            # list_body might be a dict with 'items' or 'data' or be a list
            candidates = []
            if isinstance(list_body, list):
                candidates = list_body
            elif isinstance(list_body, dict):
                for key in ("items", "data", "questions", "results"):
                    if key in list_body and isinstance(list_body[key], list):
                        candidates = list_body[key]
                        break
                # if none found, try to interpret the top-level dict as a single resource container
                if not candidates:
                    # maybe the response is { "questions": {...} } with a mapping; fallback to empty
                    for v in list_body.values():
                        if isinstance(v, list):
                            candidates = v
                            break
            if not candidates:
                raise AssertionError("No existing questions available from GET /api/questions to use for the test.")
            first = candidates[0]
            if isinstance(first, dict):
                created_id = first.get("id") or first.get("_id") or first.get("questionId") or first.get("question_id")
            if not created_id:
                raise AssertionError("Could not extract question id from questions list response.")

        # At this point we should have a valid question id
        assert created_id, "Failed to obtain a question ID for testing GET /api/questions/:id"

        # Test: GET /api/questions/:id should return 200 with metadata and company breakdown
        get_url = f"{BASE_URL}/api/questions/{created_id}"
        try:
            q_resp = session.get(get_url, timeout=TIMEOUT)
        except requests.RequestException as e:
            raise AssertionError(f"Failed to GET {get_url}: {e}")
        assert q_resp.status_code == 200, f"Expected 200 for GET {get_url}, got {q_resp.status_code}"
        try:
            q_body = q_resp.json()
        except ValueError:
            raise AssertionError(f"GET {get_url} returned 200 but no JSON body")

        # Validate that response contains question metadata fields and company breakdown
        # Accept multiple possible key names for company breakdown per implementations
        metadata_keys = ("title", "difficulty", "tags", "description")
        if not any(k in q_body for k in metadata_keys):
            # maybe resource nested under 'data' or 'question'
            nested = None
            for c in ("data", "question", "result"):
                if c in q_body and isinstance(q_body[c], dict):
                    nested = q_body[c]
                    break
            if nested:
                q_body = nested
        # Now assert presence of at least title and a company breakdown representation
        assert "title" in q_body or "slug" in q_body, "Response missing expected question metadata (title/slug)"
        # Check for company breakdown keys
        company_keys = ("companyBreakdown", "companies", "company_breakdown", "companyDistribution")
        if not any(k in q_body for k in company_keys):
            # Some APIs may include company info under 'meta' or 'stats'
            alt_found = False
            for alt in ("meta", "stats", "info"):
                if alt in q_body and isinstance(q_body[alt], dict):
                    for ck in company_keys:
                        if ck in q_body[alt]:
                            alt_found = True
                            break
                if alt_found:
                    break
            assert alt_found, "Response missing company breakdown information (expected keys like companies or companyBreakdown)"
        # basic structure checks passed

        # Test: invalid ID should return 404
        invalid_id = f"nonexistent-{uuid.uuid4().hex[:8]}"
        invalid_url = f"{BASE_URL}/api/questions/{invalid_id}"
        try:
            invalid_resp = session.get(invalid_url, timeout=TIMEOUT)
        except requests.RequestException as e:
            raise AssertionError(f"Failed to GET {invalid_url}: {e}")
        # The PRD expects 404 for non-existent question ids
        assert invalid_resp.status_code == 404, f"Expected 404 for GET {invalid_url}, got {invalid_resp.status_code}"

        print("TC004 passed: GET /api/questions/:id returns expected metadata and company breakdown for valid id and 404 for invalid id.")

    except AssertionError:
        traceback.print_exc()
        raise
    except Exception:
        traceback.print_exc()
        raise
    finally:
        # Clean up created resource if we created one
        if created_via_post and created_id:
            delete_url = f"{BASE_URL}/api/questions/{created_id}"
            try:
                del_resp = session.delete(delete_url, timeout=TIMEOUT)
                if del_resp.status_code not in (200, 204):
                    # best-effort cleanup; not failing the test now
                    print(f"Warning: cleanup DELETE {delete_url} returned {del_resp.status_code}")
            except requests.RequestException as e:
                print(f"Warning: exception during cleanup DELETE {delete_url}: {e}")

if __name__ == "__main__":
    try:
        test_get_question_by_id_TC004()
    except Exception as e:
        print(f"TC004 failed: {e}")
        sys.exit(1)
    sys.exit(0)