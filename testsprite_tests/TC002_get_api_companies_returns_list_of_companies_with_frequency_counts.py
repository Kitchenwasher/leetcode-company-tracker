import requests
import sys

BASE_ENDPOINT = "http://localhost:5000/"

def test_get_companies_returns_list_with_frequency_counts():
    url = BASE_ENDPOINT.rstrip("/") + "/api/companies"
    headers = {"Accept": "application/json"}
    try:
        resp = requests.get(url, headers=headers, timeout=30)
    except requests.exceptions.RequestException as e:
        raise AssertionError(f"HTTP request to {url} failed: {e}")

    # Status code should be 200
    assert resp.status_code == 200, f"Expected status 200, got {resp.status_code}. Body: {resp.text}"

    # Parse JSON
    try:
        payload = resp.json()
    except ValueError:
        raise AssertionError(f"Response is not valid JSON. Body: {resp.text}")

    # Normalize to a list of companies
    companies = None
    if isinstance(payload, list):
        companies = payload
    elif isinstance(payload, dict):
        if "companies" in payload and isinstance(payload["companies"], list):
            companies = payload["companies"]
        elif "data" in payload and isinstance(payload["data"], list):
            companies = payload["data"]
        else:
            # pick first list value if present
            lists = [v for v in payload.values() if isinstance(v, list)]
            if lists:
                companies = lists[0]

    if companies is None:
        raise AssertionError(f"Expected JSON array of companies but got: {payload}")

    # Expect a non-empty list of companies with frequency counts
    assert isinstance(companies, list), "Companies payload is not a list"
    assert len(companies) > 0, "Companies list is empty; expected at least one company with frequency count"

    # Validate each company entry contains a name-like string and a numeric frequency/count
    for idx, item in enumerate(companies):
        assert isinstance(item, dict), f"Company item at index {idx} is not an object: {item}"

        # name-like field: any string value
        name_found = any(isinstance(v, str) and v.strip() != "" for v in item.values())

        # count-like field: integer or numeric string
        def is_numeric_value(v):
            if isinstance(v, int):
                return True
            if isinstance(v, str):
                try:
                    int(v)
                    return True
                except Exception:
                    return False
            return False

        count_found = any(is_numeric_value(v) for v in item.values())

        assert name_found, f"Company item at index {idx} has no name-like string field: {item}"
        assert count_found, f"Company item at index {idx} has no numeric frequency/count field: {item}"

    print("test_get_companies_returns_list_with_frequency_counts: PASSED")

if __name__ == "__main__":
    try:
        test_get_companies_returns_list_with_frequency_counts()
    except AssertionError as e:
        print(f"test_get_companies_returns_list_with_frequency_counts: FAILED -> {e}")
        sys.exit(1)
    except Exception as e:
        print(f"test_get_companies_returns_list_with_frequency_counts: ERROR -> {e}")
        sys.exit(2)
    sys.exit(0)