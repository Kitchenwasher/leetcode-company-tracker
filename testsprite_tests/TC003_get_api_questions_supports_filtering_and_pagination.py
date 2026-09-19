import requests
import sys

BASE_URL = "http://localhost:5000"
TIMEOUT = 30


def _extract_questions_and_meta(json_body):
    # Try various common shapes to find the list of questions and pagination metadata
    if isinstance(json_body, list):
        return json_body, {}
    if not isinstance(json_body, dict):
        return [], {}
    # Common keys for list
    for key in ("items", "data", "results", "questions"):
        if key in json_body and isinstance(json_body[key], list):
            meta = {k: v for k, v in json_body.items() if k != key}
            return json_body[key], meta
    # If a top-level 'rows' or similar
    for key in ("rows",):
        if key in json_body and isinstance(json_body[key], list):
            meta = {k: v for k, v in json_body.items() if k != key}
            return json_body[key], meta
    # Fallback: find first list value in dict
    for v in json_body.values():
        if isinstance(v, list):
            return v, {}
    # Nothing found
    return [], {}


def _get_field(item, candidates, default=None):
    for c in candidates:
        if c in item:
            return item[c]
    return default


def test_get_questions_filtering_pagination():
    session = requests.Session()
    try:
        # 1) Fetch all questions to derive sample filter values (if any)
        resp = session.get(f"{BASE_URL}/api/questions", timeout=TIMEOUT)
    except requests.RequestException as e:
        raise AssertionError(f"Request to GET /api/questions failed: {e}")

    assert resp.status_code == 200, f"Expected 200 from GET /api/questions, got {resp.status_code}"
    try:
        body = resp.json()
    except ValueError:
        raise AssertionError("Response from GET /api/questions is not valid JSON")

    questions, meta = _extract_questions_and_meta(body)
    assert isinstance(questions, list), "Questions payload is not a list"

    # If we have at least one question, derive filters from it
    sample_company = None
    sample_difficulty = None
    sample_tag = None
    sample_keyword = None

    if len(questions) > 0:
        first = questions[0]
        # company could be string or list or object
        company = _get_field(first, ["company", "companies", "companyName", "company_names"])
        if isinstance(company, list) and len(company) > 0:
            sample_company = company[0]
        elif isinstance(company, dict):
            # maybe breakdown map
            keys = list(company.keys())
            if keys:
                sample_company = keys[0]
        elif isinstance(company, str):
            sample_company = company

        # difficulty
        difficulty = _get_field(first, ["difficulty", "level"])
        if isinstance(difficulty, str):
            sample_difficulty = difficulty

        # tags - could be list or string
        tags = _get_field(first, ["tags", "topics", "tag"])
        if isinstance(tags, list) and len(tags) > 0:
            sample_tag = tags[0]
        elif isinstance(tags, str) and tags:
            sample_tag = tags.split(",")[0].strip()

        # keyword from title or name or description
        title = _get_field(first, ["title", "name", "question", "prompt", "description"])
        if isinstance(title, str) and title.strip():
            sample_keyword = title.strip().split()[0]  # first word as keyword

    # 2) Build filter params using whatever sample values we could find
    params = {}
    if sample_company:
        params["company"] = sample_company
    if sample_difficulty:
        params["difficulty"] = sample_difficulty
    if sample_tag:
        params["tag"] = sample_tag
    if sample_keyword:
        params["keyword"] = sample_keyword

    # Also request pagination: try common param names
    # We'll use 'page' and 'per_page' and include fallback checks later
    params_for_pagination = params.copy()
    params_for_pagination.update({"page": 1, "per_page": 1})

    # 3) Perform filtered request (with pagination hints)
    try:
        filtered_resp = session.get(f"{BASE_URL}/api/questions", params=params_for_pagination, timeout=TIMEOUT)
    except requests.RequestException as e:
        raise AssertionError(f"Request to filtered GET /api/questions failed: {e}")

    assert filtered_resp.status_code == 200, f"Expected 200 from filtered GET /api/questions, got {filtered_resp.status_code}"
    try:
        filtered_body = filtered_resp.json()
    except ValueError:
        raise AssertionError("Filtered response from GET /api/questions is not valid JSON")

    filtered_questions, filtered_meta = _extract_questions_and_meta(filtered_body)
    assert isinstance(filtered_questions, list), "Filtered questions payload is not a list"

    # If per_page was respected we should have at most 1 item returned
    if isinstance(filtered_questions, list):
        assert len(filtered_questions) <= 1 or any(k in filtered_meta for k in ("total", "page", "per_page", "perPage", "limit")), \
            "Pagination metadata not present and result size larger than expected for per_page=1"

    # Validate that each returned item matches provided filters (if those filters were sent)
    def matches_filters(item):
        # company match
        if "company" in params:
            # item may have several shapes
            comp_field = _get_field(item, ["company", "companies", "companyName", "company_names"])
            match = False
            if isinstance(comp_field, str):
                match = params["company"].lower() == comp_field.lower()
            elif isinstance(comp_field, list):
                match = any(params["company"].lower() == str(x).lower() for x in comp_field)
            elif isinstance(comp_field, dict):
                match = any(params["company"].lower() == str(k).lower() for k in comp_field.keys())
            if not match:
                return False
        if "difficulty" in params and params["difficulty"]:
            diff_field = _get_field(item, ["difficulty", "level"])
            if not (isinstance(diff_field, str) and diff_field.lower() == params["difficulty"].lower()):
                return False
        if "tag" in params and params["tag"]:
            tag_field = _get_field(item, ["tags", "topics", "tag"])
            if isinstance(tag_field, list):
                if not any(params["tag"].lower() == str(t).lower() for t in tag_field):
                    return False
            elif isinstance(tag_field, str):
                if params["tag"].lower() not in tag_field.lower():
                    return False
            else:
                return False
        if "keyword" in params and params["keyword"]:
            text_field = _get_field(item, ["title", "name", "question", "prompt", "description"], "")
            if not isinstance(text_field, str) or params["keyword"].lower() not in text_field.lower():
                return False
        return True

    # If we provided any filters, ensure matches
    if params:
        for it in filtered_questions:
            assert matches_filters(it), f"Returned item does not match filters: {params}"

    # 4) Verify unknown company returns 200 and empty results (per PRD)
    unknown_company = "__NoSuchCompanyXYZ__"
    try:
        unknown_resp = session.get(f"{BASE_URL}/api/questions", params={"company": unknown_company}, timeout=TIMEOUT)
    except requests.RequestException as e:
        raise AssertionError(f"Request to GET /api/questions with unknown company failed: {e}")
    assert unknown_resp.status_code == 200, f"Expected 200 from GET /api/questions?company=Unknown, got {unknown_resp.status_code}"
    try:
        unknown_body = unknown_resp.json()
    except ValueError:
        raise AssertionError("Response from GET /api/questions?company=Unknown is not valid JSON")
    unknown_questions, _ = _extract_questions_and_meta(unknown_body)
    assert isinstance(unknown_questions, list), "Unknown-company query did not return a list"
    assert len(unknown_questions) == 0, f"Expected empty result set for unknown company, got {len(unknown_questions)} items"

    # 5) Ensure pagination metadata exists on original listing or filtered result if available
    pagination_keys = {"total", "page", "per_page", "perPage", "limit", "meta", "pagination"}
    meta_present = any(k in meta for k in pagination_keys) or any(k in filtered_meta for k in pagination_keys)
    # If no metadata present, it's acceptable if the payload is a plain list. But at least one of the responses should either include meta or be a list (we already have lists).
    assert (meta_present or isinstance(body, list) or isinstance(filtered_body, list)), "Pagination metadata not found in responses and payload is not a plain list"

    print("TC003 passed: GET /api/questions supports filtering and pagination (responses validated).")


if __name__ == "__main__":
    try:
        test_get_questions_filtering_pagination()
    except AssertionError as e:
        print(f"TEST FAILED: {e}")
        sys.exit(1)
    except Exception as exc:
        print(f"UNEXPECTED ERROR: {exc}")
        sys.exit(2)
    print("TEST COMPLETED SUCCESSFULLY.")