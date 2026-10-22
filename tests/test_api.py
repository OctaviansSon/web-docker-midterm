import os
import uuid

os.environ["DATABASE_URL"] = f"sqlite:///./test_{uuid.uuid4().hex}.db"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.database import engine  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c
    engine.dispose()
    os.remove(os.environ["DATABASE_URL"].replace("sqlite:///./", ""))


def register_and_login(client, name):
    r = client.post("/api/auth/register", json={"username": name, "email": f"{name}@example.com", "password": "secret123"})
    assert r.status_code == 201, r.text
    uid = r.json()["id"]
    r = client.post("/api/auth/login", json={"email": f"{name}@example.com", "password": "secret123"})
    assert r.status_code == 200
    return uid, {"Authorization": f"Bearer {r.json()['access_token']}"}


def test_health(client):
    assert client.get("/health").json() == {"status": "ok", "database": "up"}


def test_auth_flow(client):
    uid, h = register_and_login(client, "alice")
    me = client.get("/api/auth/me", headers=h).json()
    assert me["id"] == uid and "password" not in me and "password_hash" not in me
    dup = client.post("/api/auth/register", json={"username": "alice2", "email": "alice@example.com", "password": "secret123"})
    assert dup.status_code == 409
    bad = client.post("/api/auth/login", json={"email": "alice@example.com", "password": "wrong"})
    assert bad.status_code == 401
    assert client.get("/api/auth/me").status_code == 401
    assert client.get("/api/auth/me", headers={"Authorization": "Bearer garbage"}).status_code == 401
    short = client.post("/api/auth/register", json={"username": "x", "email": "bad", "password": "1"})
    assert short.status_code == 422


def test_teams_tasks_and_permissions(client):
    owner_id, owner = register_and_login(client, "owner")
    member_id, member = register_and_login(client, "member")
    _, outsider = register_and_login(client, "outsider")

    # teams CRUD
    team = client.post("/api/teams", json={"name": "CKA group", "description": "k8s"}, headers=owner)
    assert team.status_code == 201 and team.json()["my_role"] == "owner"
    tid = team.json()["id"]
    assert [t["id"] for t in client.get("/api/teams", headers=owner).json()] == [tid]
    assert client.get("/api/teams", headers=member).json() == []
    assert client.get(f"/api/teams/{tid}", headers=outsider).status_code == 403
    assert client.get("/api/teams/9999", headers=owner).status_code == 404
    upd = client.put(f"/api/teams/{tid}", json={"name": "CKA squad"}, headers=owner)
    assert upd.status_code == 200 and upd.json()["name"] == "CKA squad"

    # members
    assert client.post(f"/api/teams/{tid}/members", json={"email": "member@example.com"}, headers=outsider).status_code == 403
    added = client.post(f"/api/teams/{tid}/members", json={"email": "member@example.com"}, headers=owner)
    assert added.status_code == 201 and added.json()["role"] == "member"
    assert client.post(f"/api/teams/{tid}/members", json={"email": "member@example.com"}, headers=owner).status_code == 409
    assert client.post(f"/api/teams/{tid}/members", json={"email": "nobody@example.com"}, headers=owner).status_code == 404
    assert client.put(f"/api/teams/{tid}", json={"name": "hack"}, headers=member).status_code == 403
    assert len(client.get(f"/api/teams/{tid}", headers=member).json()["members"]) == 2

    # tasks CRUD
    t1 = client.post(f"/api/teams/{tid}/tasks", json={
        "title": "Design a VPC", "category": "aws", "priority": "high", "assignee_id": member_id, "due_date": "2020-01-01"
    }, headers=owner)
    assert t1.status_code == 201, t1.text
    task_id = t1.json()["id"]
    assert t1.json()["status"] == "backlog"
    t2 = client.post(f"/api/teams/{tid}/tasks", json={"title": "etcd backup", "category": "kubernetes"}, headers=member)
    assert t2.status_code == 201
    assert client.post(f"/api/teams/{tid}/tasks", json={"title": "x", "assignee_id": 9999}, headers=owner).status_code == 422
    assert client.post(f"/api/teams/{tid}/tasks", json={"title": "x"}, headers=outsider).status_code == 403
    assert client.post(f"/api/teams/{tid}/tasks", json={"title": ""}, headers=owner).status_code == 422

    assert len(client.get(f"/api/teams/{tid}/tasks", headers=owner).json()) == 2
    assert len(client.get(f"/api/teams/{tid}/tasks?category=aws", headers=owner).json()) == 1
    assert len(client.get(f"/api/teams/{tid}/tasks?q=etcd", headers=owner).json()) == 1
    assert len(client.get(f"/api/teams/{tid}/tasks?assignee_id={member_id}", headers=owner).json()) == 1
    assert client.get(f"/api/teams/{tid}/tasks?status=bogus", headers=owner).status_code == 422
    assert client.get(f"/api/tasks/{task_id}", headers=outsider).status_code == 403
    assert client.get(f"/api/tasks/{task_id}", headers=member).json()["title"] == "Design a VPC"

    upd = client.put(f"/api/tasks/{task_id}", json={"priority": "low", "assignee_id": None}, headers=member)
    assert upd.status_code == 200
    assert upd.json()["priority"] == "low" and upd.json()["assignee_id"] is None and upd.json()["title"] == "Design a VPC"
    st = client.patch(f"/api/tasks/{task_id}/status", json={"status": "done"}, headers=member)
    assert st.json()["status"] == "done"

    # stats
    stats = client.get(f"/api/teams/{tid}/stats", headers=owner).json()
    assert stats["total_tasks"] == 2 and stats["done_tasks"] == 1 and stats["progress_percent"] == 50.0
    assert stats["by_status"]["done"] == 1 and stats["by_category"]["aws"] == 1
    cka = next(c for c in stats["certifications"] if c["name"] == "CKA")
    assert cka["total"] == 1 and cka["done"] == 0

    # removing a member
    assert client.delete(f"/api/teams/{tid}/members/{owner_id}", headers=owner).status_code == 400
    assert client.delete(f"/api/teams/{tid}/members/{member_id}", headers=outsider).status_code == 403
    assert client.delete(f"/api/teams/{tid}/members/{member_id}", headers=owner).status_code == 204
    assert client.get(f"/api/tasks/{task_id}", headers=member).status_code == 403

    # delete task / team
    assert client.delete(f"/api/tasks/{task_id}", headers=owner).status_code == 204
    assert client.get(f"/api/tasks/{task_id}", headers=owner).status_code == 404
    assert client.delete(f"/api/teams/{tid}", headers=owner).status_code == 204
    assert client.get(f"/api/teams/{tid}", headers=owner).status_code == 404
