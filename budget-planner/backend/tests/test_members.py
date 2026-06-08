"""Test quản lý thành viên (mời/đổi vai trò/xoá) + audit."""

from fastapi.testclient import TestClient


def _member_id(client: TestClient, owner: dict, email: str) -> str:
    """Tìm membership id theo email trong không gian của owner."""
    members = client.get("/members", headers=owner["headers"]).json()
    return next(m["id"] for m in members if m["email"] == email)


def test_owner_invites_member(client: TestClient, owner: dict, register) -> None:
    """Owner mời user đã tồn tại → 201 + audit member.invited."""
    register(email="m@x.com")
    r = client.post(
        "/members", json={"email": "m@x.com", "role": "member"}, headers=owner["headers"]
    )
    assert r.status_code == 201
    assert r.json()["role"] == "member"

    logs = client.get("/audit-logs", headers=owner["headers"]).json()
    assert any(log["action"] == "member.invited" for log in logs)


def test_invite_unknown_email_404(client: TestClient, owner: dict) -> None:
    r = client.post("/members", json={"email": "nobody@x.com"}, headers=owner["headers"])
    assert r.status_code == 404


def test_invite_duplicate_409(client: TestClient, owner: dict, register) -> None:
    register(email="m@x.com")
    client.post("/members", json={"email": "m@x.com"}, headers=owner["headers"])
    r = client.post("/members", json={"email": "m@x.com"}, headers=owner["headers"])
    assert r.status_code == 409


def test_list_members(client: TestClient, owner: dict, make_member) -> None:
    make_member(owner, role="member", email="m@x.com")
    members = client.get("/members", headers=owner["headers"]).json()
    emails = {m["email"] for m in members}
    assert owner["email"] in emails
    assert "m@x.com" in emails


def test_change_role(client: TestClient, owner: dict, make_member) -> None:
    make_member(owner, role="member", email="m@x.com")
    mid = _member_id(client, owner, "m@x.com")
    r = client.patch(f"/members/{mid}", json={"role": "admin"}, headers=owner["headers"])
    assert r.status_code == 200
    assert r.json()["role"] == "admin"


def test_admin_cannot_grant_owner(client: TestClient, owner: dict, make_member) -> None:
    admin = make_member(owner, role="admin", email="a@x.com")
    make_member(owner, role="member", email="m@x.com")
    mid = _member_id(client, owner, "m@x.com")
    r = client.patch(f"/members/{mid}", json={"role": "owner"}, headers=admin["headers"])
    assert r.status_code == 403


def test_cannot_change_owner_role(client: TestClient, owner: dict, make_member) -> None:
    admin = make_member(owner, role="admin", email="a@x.com")
    owner_mid = _member_id(client, owner, owner["email"])
    r = client.patch(f"/members/{owner_mid}", json={"role": "member"}, headers=admin["headers"])
    assert r.status_code == 403


def test_remove_member(client: TestClient, owner: dict, make_member) -> None:
    make_member(owner, role="member", email="m@x.com")
    mid = _member_id(client, owner, "m@x.com")
    assert client.delete(f"/members/{mid}", headers=owner["headers"]).status_code == 204

    logs = client.get("/audit-logs", headers=owner["headers"]).json()
    assert any(log["action"] == "member.removed" for log in logs)


def test_member_cannot_invite(client: TestClient, owner: dict, make_member, register) -> None:
    m = make_member(owner, role="member", email="m@x.com")
    register(email="x@x.com")
    r = client.post("/members", json={"email": "x@x.com"}, headers=m["headers"])
    assert r.status_code == 403
