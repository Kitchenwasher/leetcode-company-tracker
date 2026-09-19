import requests
import sys

BASE_URL = "http://localhost:5000/"
TIMEOUT = 30

def test_get_api_questions_id_solution_returns_multi_approach_cpp_solutions():
    created_id = None
    created = False
    try:
        # Step 1: Try to obtain an existing question ID via GET /api/questions
        try:
            resp = requests.get(BASE_URL + "api/questions", timeout=TIMEOUT)
        except requests.RequestException as e:
            raise AssertionError(f"Failed to GET /api/questions: {e}")

        assert resp.status_code == 200, f"Expected 200 from GET /api/questions, got {resp.status_code}"
        try:
            body = resp.json()
        except ValueError:
            raise AssertionError("GET /api/questions did not return valid JSON")

        # Helper to extract first question id from common paginated shapes
        def extract_first_id(data):
            # If list at top level
            if isinstance(data, list) and len(data) > 0:
                first = data[0]
                for key in ("id", "_id", "questionId", "question_id"):
                    if isinstance(first, dict) and key in first:
                        return first[key]
                # if element itself is a string or int
                if isinstance(first, (str, int)):
                    return first
            # If dict with common pagination containers
            if isinstance(data, dict):
                for container in ("items", "data", "results", "questions"):
                    if container in data and isinstance(data[container], list) and len(data[container]) > 0:
                        first = data[container][0]
                        for key in ("id", "_id", "questionId", "question_id"):
                            if isinstance(first, dict) and key in first:
                                return first[key]
                        if isinstance(first, (str, int)):
                            return first
                # Maybe direct question object
                for key in ("id", "_id", "questionId", "question_id"):
                    if key in data:
                        return data[key]
            return None

        qid = extract_first_id(body)

        # If no existing question found, attempt to create one (best-effort)
        if not qid:
            create_payload = {
                "title": "Test Question for TC005",
                "description": "Auto-created question for solution retrieval test",
                "difficulty": "Medium",
                "tags": ["Arrays"],
                "companies": ["TestCo"]
            }
            try:
                create_resp = requests.post(BASE_URL + "api/questions", json=create_payload, timeout=TIMEOUT)
            except requests.RequestException as e:
                raise AssertionError(f"Failed to POST /api/questions to create test resource: {e}")

            if create_resp.status_code not in (200, 201):
                # If creation endpoint not available, fail the test since no resource id available
                raise AssertionError(f"Unable to locate existing question and POST /api/questions failed with status {create_resp.status_code}: {create_resp.text}")

            try:
                create_body = create_resp.json()
            except ValueError:
                raise AssertionError("POST /api/questions did not return valid JSON for created resource")

            qid = None
            # attempt to extract id from creation response
            for key in ("id", "_id", "questionId", "question_id"):
                if key in create_body:
                    qid = create_body[key]
                    break
            # some APIs return the created object under 'data'
            if not qid and isinstance(create_body, dict) and "data" in create_body:
                data = create_body["data"]
                if isinstance(data, dict):
                    for key in ("id", "_id", "questionId", "question_id"):
                        if key in data:
                            qid = data[key]
                            break
            if not qid:
                # As a fallback, if response is list or contains items
                def try_extract(data):
                    if isinstance(data, list) and len(data) > 0:
                        first = data[0]
                        if isinstance(first, (str, int)):
                            return first
                        if isinstance(first, dict):
                            for k in ("id", "_id", "questionId", "question_id"):
                                if k in first:
                                    return first[k]
                    return None
                qid = try_extract(create_body)
            if not qid:
                raise AssertionError("Created question response did not include an identifiable id")
            created = True
            created_id = qid

        # Step 2: GET /api/questions/:id/solution for the valid question id
        solution_url = BASE_URL + f"api/questions/{qid}/solution"
        try:
            sol_resp = requests.get(solution_url, timeout=TIMEOUT)
        except requests.RequestException as e:
            raise AssertionError(f"Failed to GET {solution_url}: {e}")

        assert sol_resp.status_code == 200, f"Expected 200 from GET /api/questions/{qid}/solution, got {sol_resp.status_code}"
        try:
            sol_body = sol_resp.json()
        except ValueError:
            raise AssertionError("GET solution did not return valid JSON")

        # Validate structure: expect approaches list with at least one C++ approach containing code, invariants, complexity
        # Tolerate a couple of schema variants.
        approaches = None
        if isinstance(sol_body, dict):
            for key in ("approaches", "solutions", "data", "approachList"):
                if key in sol_body and isinstance(sol_body[key], list):
                    approaches = sol_body[key]
                    break
            # maybe the response is the approach list directly
            if approaches is None and isinstance(sol_body, list):
                approaches = sol_body

        if not approaches or not isinstance(approaches, list) or len(approaches) == 0:
            raise AssertionError("Solution response does not contain an 'approaches' list or it's empty")

        # Find at least one C++ approach
        cpp_approach = None
        for a in approaches:
            if not isinstance(a, dict):
                continue
            lang = None
            # language may be under 'language' or 'lang'
            for key in ("language", "lang", "languageName"):
                if key in a:
                    lang = a[key]
                    break
            # or approach may specify 'languages' list
            if not lang and "languages" in a and isinstance(a["languages"], list) and len(a["languages"]) > 0:
                lang = a["languages"][0]
            if isinstance(lang, str) and ("c++" in lang.lower() or "cpp" in lang.lower()):
                cpp_approach = a
                break
            # sometimes approach has 'code' keyed by language
            if "code" in a and isinstance(a["code"], dict):
                for k in a["code"].keys():
                    if "c++" in k.lower() or "cpp" in k.lower():
                        # normalize into a dict-like approach
                        cpp_approach = {
                            "language": k,
                            "code": a["code"][k],
                            "invariants": a.get("invariants", a.get("invariant")),
                            "complexity": a.get("complexity")
                        }
                        break
            if cpp_approach:
                break

        assert cpp_approach is not None, "No C++ approach found in solution approaches"

        # Validate code presence
        code = None
        if "code" in cpp_approach and isinstance(cpp_approach["code"], str):
            code = cpp_approach["code"]
        elif "code" in cpp_approach and isinstance(cpp_approach["code"], dict):
            # take any string code if stored in dict
            for v in cpp_approach["code"].values():
                if isinstance(v, str):
                    code = v
                    break
        assert code and isinstance(code, str) and code.strip() != "", "C++ approach does not include non-empty code"

        # Validate invariants presence (could be list or string)
        invariants = cpp_approach.get("invariants") or cpp_approach.get("invariant") or sol_body.get("invariants")
        assert invariants is not None, "C++ approach missing 'invariants' field"

        # Validate complexity presence (expect dict with time/space or string)
        complexity = cpp_approach.get("complexity") or sol_body.get("complexity")
        assert complexity is not None, "C++ approach missing 'complexity' field"
        # If complexity is dict, ensure some keys present
        if isinstance(complexity, dict):
            assert any(k in complexity for k in ("time", "timeComplexity", "time_complexity", "time-complexity")), "Complexity dict missing time information"
            assert any(k in complexity for k in ("space", "spaceComplexity", "space_complexity", "space-complexity")), "Complexity dict missing space information"
        else:
            # allow string descriptions but ensure non-empty
            assert isinstance(complexity, str) and complexity.strip() != "", "Complexity field is empty"

        # Success: also verify an appropriate error response for invalid/non-existent id
        invalid_id = "00000000-invalid-id-xxxx"
        try:
            invalid_resp = requests.get(BASE_URL + f"api/questions/{invalid_id}/solution", timeout=TIMEOUT)
            # Expecting a 4xx (likely 404). Accept any client error.
            assert 400 <= invalid_resp.status_code < 500, f"Expected 4xx for invalid id request, got {invalid_resp.status_code}"
        except requests.RequestException:
            # network errors for invalid id are treated as failure
            raise AssertionError("Request for invalid id failed unexpectedly")

        print("TC005 passed: GET /api/questions/:id/solution returned multi-approach C++ solution with code, invariants, and complexity.")

    finally:
        # Cleanup if we created a resource
        if created and created_id:
            try:
                del_resp = requests.delete(BASE_URL + f"api/questions/{created_id}", timeout=TIMEOUT)
                # Not asserting delete success to avoid failing cleanup; just log if unexpected
                if del_resp.status_code not in (200, 204):
                    print(f"Warning: cleanup DELETE /api/questions/{created_id} returned {del_resp.status_code}", file=sys.stderr)
            except requests.RequestException as e:
                print(f"Warning: cleanup DELETE /api/questions/{created_id} failed: {e}", file=sys.stderr)

if __name__ == "__main__":
    test_get_api_questions_id_solution_returns_multi_approach_cpp_solutions()