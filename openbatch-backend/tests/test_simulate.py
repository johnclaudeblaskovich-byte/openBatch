from fastapi.testclient import TestClient

from app.main import app
from tests._sample import aspirin_project

client = TestClient(app)


def _drain(ws) -> list[dict]:
    """Collect WS messages until complete/error."""
    messages = []
    while True:
        msg = ws.receive_json()
        messages.append(msg)
        if msg["type"] in ("complete", "error"):
            return messages


def test_simulate_returns_job_id():
    resp = client.post("/api/simulate", json={"project": {}, "stepId": "s1"})
    assert resp.status_code == 200
    assert isinstance(resp.json()["job_id"], str)


def test_ws_runs_and_completes_with_result():
    project = aspirin_project()
    job_id = client.post(
        "/api/simulate", json={"project": project, "stepId": "step-1"}
    ).json()["job_id"]
    with client.websocket_connect(f"/ws/solve/{job_id}") as ws:
        msgs = _drain(ws)
    types = [m["type"] for m in msgs]
    assert types[0] == "status" and msgs[0]["status"] == "running"
    assert "progress" in types
    assert types[-1] == "complete"
    result = msgs[-1]["result"]
    assert "streams" in result and "operationResults" in result and "materialBalance" in result


def test_ws_unknown_job_sends_error():
    with client.websocket_connect("/ws/solve/does-not-exist") as ws:
        assert ws.receive_json() == {"type": "error", "message": "unknown job"}


def test_two_jobs_distinct_ids():
    project = aspirin_project()
    a = client.post("/api/simulate", json={"project": project, "stepId": "step-1"}).json()["job_id"]
    b = client.post("/api/simulate", json={"project": project, "stepId": "step-1"}).json()["job_id"]
    assert a != b


def test_validate_rejects_missing_project():
    resp = client.post("/api/projects/validate", json={"fileVersion": "1.0.0"})
    body = resp.json()
    assert body["valid"] is False
    assert any("project" in e for e in body["errors"])


def test_validate_accepts_project():
    resp = client.post("/api/projects/validate", json={"project": {"id": "p1"}})
    assert resp.json()["valid"] is True
