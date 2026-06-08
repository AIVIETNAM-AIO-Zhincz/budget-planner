"""Test API Categories (Full CRUD, cô lập theo không gian, cần xác thực)."""

from fastapi.testclient import TestClient


def test_create_category(client: TestClient, owner: dict) -> None:
    """Tạo danh mục → 201 kèm id, space_id."""
    resp = client.post(
        "/categories", json={"name": "Ăn uống", "type": "expense"}, headers=owner["headers"]
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["name"] == "Ăn uống"
    assert body["type"] == "expense"
    assert body["id"]
    assert body["space_id"] == owner["space_id"]


def test_create_invalid_type_rejected(client: TestClient, owner: dict) -> None:
    """type ngoài income/expense → 422."""
    resp = client.post(
        "/categories", json={"name": "X", "type": "saving"}, headers=owner["headers"]
    )
    assert resp.status_code == 422


def test_list_isolated_by_space(client: TestClient, register) -> None:
    """Danh mục cô lập theo không gian của từng user."""
    u1 = register(email="u1@x.com")
    u2 = register(email="u2@x.com")
    client.post("/categories", json={"name": "A"}, headers=u1["headers"])
    client.post("/categories", json={"name": "B"}, headers=u2["headers"])

    items = client.get("/categories", headers=u1["headers"]).json()
    assert len(items) == 1
    assert items[0]["name"] == "A"


def test_get_missing_or_cross_space_404(client: TestClient, register) -> None:
    """Lấy danh mục của không gian khác → 404 (cô lập)."""
    u1 = register(email="u1@x.com")
    u2 = register(email="u2@x.com")
    cid = client.post("/categories", json={"name": "A"}, headers=u1["headers"]).json()["id"]

    assert client.get(f"/categories/{cid}", headers=u1["headers"]).status_code == 200
    assert client.get(f"/categories/{cid}", headers=u2["headers"]).status_code == 404
    assert client.get("/categories/khong-ton-tai", headers=u1["headers"]).status_code == 404


def test_update_category(client: TestClient, owner: dict) -> None:
    """PATCH đổi tên danh mục."""
    cid = client.post("/categories", json={"name": "Cũ"}, headers=owner["headers"]).json()["id"]
    resp = client.patch(f"/categories/{cid}", json={"name": "Mới"}, headers=owner["headers"])
    assert resp.status_code == 200
    assert resp.json()["name"] == "Mới"


def test_delete_category(client: TestClient, owner: dict) -> None:
    """DELETE → 204 rồi GET → 404; có ghi audit log."""
    cid = client.post("/categories", json={"name": "Xoá"}, headers=owner["headers"]).json()["id"]

    assert client.delete(f"/categories/{cid}", headers=owner["headers"]).status_code == 204
    assert client.get(f"/categories/{cid}", headers=owner["headers"]).status_code == 404

    logs = client.get("/audit-logs", headers=owner["headers"]).json()
    assert any(log["action"] == "category.deleted" for log in logs)
