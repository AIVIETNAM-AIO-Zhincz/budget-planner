"""Test API Spaces (tạo/liệt kê/sửa không gian)."""

from fastapi.testclient import TestClient


def test_create_space(client: TestClient, owner: dict) -> None:
    r = client.post(
        "/spaces",
        json={"name": "Quỹ nhóm", "currency": "USD"},
        headers={"Authorization": f"Bearer {owner['access']}"},
    )
    assert r.status_code == 201
    body = r.json()
    assert body["name"] == "Quỹ nhóm"
    assert body["currency"] == "USD"
    assert body["role"] == "owner"


def test_list_spaces(client: TestClient, owner: dict) -> None:
    client.post(
        "/spaces", json={"name": "S2"}, headers={"Authorization": f"Bearer {owner['access']}"}
    )
    spaces = client.get("/spaces", headers={"Authorization": f"Bearer {owner['access']}"}).json()
    assert len(spaces) >= 2


def test_update_space_owner(client: TestClient, owner: dict) -> None:
    r = client.patch(
        f"/spaces/{owner['space_id']}",
        json={"name": "Tên KG mới", "currency": "EUR"},
        headers=owner["headers"],
    )
    assert r.status_code == 200
    assert r.json()["name"] == "Tên KG mới"
    assert r.json()["currency"] == "EUR"


def test_update_space_member_forbidden(client: TestClient, owner: dict, make_member) -> None:
    m = make_member(owner, role="member", email="m@x.com")
    r = client.patch(f"/spaces/{owner['space_id']}", json={"name": "X"}, headers=m["headers"])
    assert r.status_code == 403


def test_update_space_cross_404(client: TestClient, owner: dict, register) -> None:
    """User sửa không gian không phải của mình (path ≠ header space) → 404."""
    other = register(email="o2@x.com")
    r = client.patch(f"/spaces/{owner['space_id']}", json={"name": "X"}, headers=other["headers"])
    assert r.status_code == 404


def test_update_space_notification_flags(client: TestClient, owner: dict) -> None:
    """PATCH cờ thông báo → SpaceRead (PATCH + GET) trả đúng; mặc định bật."""
    h = owner["headers"]
    r = client.patch(
        f"/spaces/{owner['space_id']}",
        json={"notify_member": False, "notify_recurring": False},
        headers=h,
    )
    assert r.status_code == 200
    body = r.json()
    assert body["notify_member"] is False
    assert body["notify_recurring"] is False
    assert body["notify_budget"] is True

    sp = next(s for s in client.get("/spaces", headers=h).json() if s["id"] == owner["space_id"])
    assert sp["notify_member"] is False and sp["notify_budget"] is True
