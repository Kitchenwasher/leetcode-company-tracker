import requests
import sys

BASE_URL = "http://localhost:5000"
HEALTH_PATH = "/api/health"
TIMEOUT = 30


def test_get_api_health_returns_server_and_database_status():
    url = BASE_URL.rstrip("/") + HEALTH_PATH
    try:
        resp = requests.get(url, timeout=TIMEOUT)
    except requests.RequestException as e:
        raise AssertionError(f"HTTP request to {url} failed: {e}")

    assert resp.status_code == 200, f"Expected status code 200, got {resp.status_code}. Body: {resp.text}"

    try:
        data = resp.json()
    except ValueError:
        raise AssertionError("Response is not valid JSON")

    if not isinstance(data, dict):
        raise AssertionError(f"Expected JSON object at top level, got {type(data)}")

    def is_healthy_value(v):
        if isinstance(v, bool):
            return v is True
        if isinstance(v, str):
            return v.strip().lower() in ("ok", "healthy", "up", "available", "connected", "true")
        if isinstance(v, dict):
            for key in ("status", "state", "ok", "healthy", "connected"):
                if key in v:
                    return is_healthy_value(v[key])
        return False

    server_ok = False
    db_ok = False

    # Direct keys
    if "server" in data:
        server_ok = is_healthy_value(data["server"])
    if "database" in data:
        db_ok = is_healthy_value(data["database"])
    if "db" in data and not db_ok:
        db_ok = is_healthy_value(data["db"])

    # Heuristic search for keys that indicate server/api and database
    if not server_ok:
        for k, v in data.items():
            lk = str(k).lower()
            if "server" in lk or lk in ("api", "api_status", "service"):
                if is_healthy_value(v):
                    server_ok = True
                    break

    if not db_ok:
        for k, v in data.items():
            lk = str(k).lower()
            if "database" in lk or "db" in lk or "postgres" in lk or "sqlite" in lk:
                if is_healthy_value(v):
                    db_ok = True
                    break

    # Check aggregated status + details/components
    if not (server_ok and db_ok):
        top_status = data.get("status") or data.get("overallStatus") or data.get("health")
        if isinstance(top_status, str) and top_status.strip().lower() in ("ok", "healthy", "up"):
            details = data.get("details") or data.get("components") or data.get("checks")
            if isinstance(details, dict):
                if not server_ok:
                    for k, v in details.items():
                        if "server" in str(k).lower() or "api" in str(k).lower():
                            if is_healthy_value(v):
                                server_ok = True
                                break
                if not db_ok:
                    for k, v in details.items():
                        if "db" in str(k).lower() or "database" in str(k).lower():
                            if is_healthy_value(v):
                                db_ok = True
                                break

    assert server_ok, f"Server health not reported healthy in response JSON: {data}"
    assert db_ok, f"Database health not reported healthy in response JSON: {data}"

    print("TC001 passed: API health reports server and database healthy")


if __name__ == "__main__":
    try:
        test_get_api_health_returns_server_and_database_status()
    except AssertionError as e:
        print(f"TC001 failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"TC001 encountered unexpected error: {e}")
        sys.exit(1)
    sys.exit(0)