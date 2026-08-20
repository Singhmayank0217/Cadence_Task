"""End-to-end API tests.

Run with:  pytest -q          (from the backend/ folder)

Each run uses a throwaway SQLite file so tests never touch the dev database.
"""

import os
import tempfile

import pytest
from fastapi.testclient import TestClient

os.environ["DATABASE_URL"] = f"sqlite:///{tempfile.gettempdir()}/cadence_test.db"
os.environ["SEED_ON_STARTUP"] = "true"

from app.core.config import settings  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture(scope="module")
def client():
    db_path = settings.DATABASE_URL.replace("sqlite:///", "")
    if os.path.exists(db_path):
        os.remove(db_path)
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="module")
def auth(client):
    response = client.post(
        "/api/auth/login",
        json={"email": "mayank@cadence.dev", "password": settings.DEFAULT_PASSWORD},
    )
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def test_health(client):
    assert client.get("/health").json()["status"] == "ok"


def test_login_rejects_bad_password(client):
    response = client.post(
        "/api/auth/login", json={"email": "mayank@cadence.dev", "password": "nope"}
    )
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "unauthorized"


def test_tasks_require_authentication(client):
    assert client.get("/api/tasks").status_code == 401


def test_list_tasks_is_paginated(client, auth):
    response = client.get("/api/tasks?limit=5", headers=auth)
    assert response.status_code == 200
    body = response.json()
    assert len(body["items"]) <= 5
    assert body["meta"]["limit"] == 5
    assert body["meta"]["total"] > 0


def test_filters_and_search(client, auth):
    in_progress = client.get("/api/tasks?status=in_progress", headers=auth).json()
    assert all(task["status"] == "in_progress" for task in in_progress["items"])

    search = client.get("/api/tasks?search=shopify", headers=auth).json()
    assert search["meta"]["total"] >= 1

    unassigned = client.get("/api/tasks?assignee=unassigned", headers=auth).json()
    assert all(task["assignee"] is None for task in unassigned["items"])


def test_invalid_filter_value_returns_422(client, auth):
    response = client.get("/api/tasks?status=nonsense", headers=auth)
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_error"


def test_task_lifecycle(client, auth):
    created = client.post(
        "/api/tasks",
        headers=auth,
        json={
            "title": "Draft the incident response runbook",
            "description": "Who to page, in what order.",
            "priority": "high",
            "assigned_to": 2,
        },
    )
    assert created.status_code == 201
    task = created.json()
    task_id = task["id"]
    assert task["reference"].startswith("TSK-")
    assert any(item["action"] == "created" for item in task["activities"])

    updated = client.put(
        f"/api/tasks/{task_id}", headers=auth, json={"status": "completed"}
    )
    assert updated.status_code == 200
    assert updated.json()["completed_at"] is not None
    assert any(item["action"] == "status_changed" for item in updated.json()["activities"])

    comment = client.post(
        f"/api/tasks/{task_id}/comments", headers=auth, json={"comment": "Runbook drafted."}
    )
    assert comment.status_code == 201
    assert comment.json()["author"]["email"] == "mayank@cadence.dev"

    assert client.delete(f"/api/tasks/{task_id}", headers=auth).status_code == 204
    assert client.get(f"/api/tasks/{task_id}", headers=auth).status_code == 404


def test_cannot_assign_to_unknown_user(client, auth):
    response = client.post(
        "/api/tasks", headers=auth, json={"title": "Broken assignment", "assigned_to": 9999}
    )
    assert response.status_code == 422


def test_dashboard_totals_add_up(client, auth):
    body = client.get("/api/dashboard", headers=auth).json()
    stats, breakdown = body["stats"], body["status_breakdown"]
    assert stats["total_tasks"] == sum(breakdown.values())
    assert len(body["due_timeline"]) == 14
    assert stats["completion_rate"] >= 0


def test_duplicate_email_conflicts(client, auth):
    payload = {"name": "Test Person", "email": "duplicate@cadence.dev", "role": "member"}
    assert client.post("/api/users", headers=auth, json=payload).status_code == 201
    second = client.post("/api/users", headers=auth, json=payload)
    assert second.status_code == 409
    assert second.json()["error"]["code"] == "conflict"


def test_csv_export_respects_the_active_filters(client, auth):
    response = client.get("/api/tasks/export.csv?status=blocked", headers=auth)
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")
    assert "attachment" in response.headers["content-disposition"]

    lines = [line for line in response.text.splitlines() if line.strip()]
    assert lines[0].startswith("Reference,Title,Status")
    # Every exported row is blocked, and the status reads as display text.
    assert len(lines) > 1
    assert all(",Blocked," in line for line in lines[1:])


def test_search_matches_the_description_not_just_the_title(client, auth):
    response = client.get("/api/tasks?search=razorpay", headers=auth)
    assert response.status_code == 200
    body = response.json()
    assert body["meta"]["total"] >= 1
    # The term appears in the description, so a title-only search would miss it.
    assert all("razorpay" not in task["title"].lower() for task in body["items"])


def test_activity_trail_records_display_text_not_enum_values(client, auth):
    created = client.post(
        "/api/tasks",
        headers=auth,
        json={"title": "Check the activity trail wording", "priority": "low"},
    ).json()

    client.put(f"/api/tasks/{created['id']}", headers=auth, json={"status": "in_progress"})
    detail = client.get(f"/api/tasks/{created['id']}", headers=auth).json()

    status_entries = [a for a in detail["activities"] if a["field"] == "status"]
    assert status_entries, "a status change should be recorded"
    assert status_entries[0]["new_value"] == "In progress"

    client.delete(f"/api/tasks/{created['id']}", headers=auth)


def test_unknown_sort_field_is_rejected(client, auth):
    response = client.get("/api/tasks?sort_by=nonsense", headers=auth)
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_error"
