import requests

BASE_ENDPOINT = "http://localhost:5000"
TIMEOUT = 30

def test_get_companies_overlap():
    url = BASE_ENDPOINT.rstrip("/") + "/api/companies/overlap"
    params = {"companies": "Google,Facebook"}
    headers = {"Accept": "application/json"}

    try:
        resp = requests.get(url, params=params, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        raise AssertionError(f"HTTP request failed: {e}")

    assert resp.status_code == 200, f"Expected status 200 but got {resp.status_code}. Response body: {resp.text}"

    try:
        data = resp.json()
    except ValueError:
        raise AssertionError("Response is not valid JSON")

    assert isinstance(data, dict), f"Expected JSON object in response, got {type(data)}"

    # Ensure response contains overlap-related fields
    response_keys = set(data.keys())
    possible_overlap_keys = {"companies", "overlap", "intersection", "questions", "count", "overlapCount"}
    assert response_keys & possible_overlap_keys, f"Response JSON missing expected overlap fields. Keys present: {response_keys}"

    # If 'companies' provided in response, ensure requested companies are included (case-insensitive)
    if "companies" in data:
        assert isinstance(data["companies"], list), "'companies' field should be a list"
        requested = [c.strip().lower() for c in params["companies"].split(",")]
        returned = [str(c).lower() for c in data["companies"]]
        for comp in requested:
            assert comp in returned, f"Requested company '{comp}' not found in response companies {data['companies']}"

    # If questions list is returned, validate its structure
    if "questions" in data:
        assert isinstance(data["questions"], list), "'questions' field should be a list"
        if data["questions"]:
            first = data["questions"][0]
            assert isinstance(first, dict), "Each question entry should be a JSON object"
            # Ensure question has at least one identifying field
            assert any(k in first for k in ("id", "questionId", "slug", "title", "name")), "Question item missing identifier/title keys"

    print("TC006 passed: GET /api/companies/overlap returned expected overlap results")

if __name__ == "__main__":
    test_get_companies_overlap()