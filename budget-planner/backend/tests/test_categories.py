"""Test API Categories (Full CRUD, cô lập theo space_id)."""

from fastapi.testclient import TestClient


def test_create_category(client: TestClient) -> None:
    """Tạo danh mục → 201 kèm id, space_id."""
    resp = client.post("/categories", json={"name": "Ăn uống", "type": "expense"})
    assert resp.status_code == 201
    body = resp.json()
    assert body["name"] == "Ăn uống"
    assert body["type"] == "expense"
    assert body["id"]
    assert body["space_id"]


def test_create_invalid_type_rejected(client: TestClient) -> None:
    """type ngoài income/expense → 422."""
    resp = client.post("/categories", json={"name": "X", "type": "saving"})
    assert resp.status_code == 422


def test_list_isolated_by_space(client: TestClient) -> None:
    """Danh mục cô lập theo space_id (header X-Space-Id)."""
    client.post("/categories", json={"name": "A"}, headers={"X-Space-Id": "s1"})
    client.post("/categories", json={"name": "B"}, headers={"X-Space-Id": "s2"})

    r1 = client.get("/categories", headers={"X-Space-Id": "s1"})
    assert r1.status_code == 200
    items = r1.json()
    assert len(items) == 1
    assert items[0]["name"] == "A"


def test_get_missing_or_cross_space_404(client: TestClient) -> None:
    """Lấy danh mục của space khác → 404 (cô lập)."""
    cid = client.post("/categories", json={"name": "A"}, headers={"X-Space-Id": "s1"}).json()["id"]

    assert client.get(f"/categories/{cid}", headers={"X-Space-Id": "s1"}).status_code == 200
    assert client.get(f"/categories/{cid}", headers={"X-Space-Id": "s2"}).status_code == 404
    assert client.get("/categories/khong-ton-tai", headers={"X-Space-Id": "s1"}).status_code == 404


def test_update_category(client: TestClient) -> None:
    """PATCH đổi tên danh mục."""
    cid = client.post("/categories", json={"name": "Cũ"}).json()["id"]
    resp = client.patch(f"/categories/{cid}", json={"name": "Mới"})
    assert resp.status_code == 200
    assert resp.json()["name"] == "Mới"


def test_delete_category(client: TestClient) -> None:
    """DELETE → 204 rồi GET → 404; có ghi audit log."""
    cid = client.post("/categories", json={"name": "Xoá"}, headers={"X-Space-Id": "sx"}).json()[
        "id"
    ]

    assert client.delete(f"/categories/{cid}", headers={"X-Space-Id": "sx"}).status_code == 204
    assert client.get(f"/categories/{cid}", headers={"X-Space-Id": "sx"}).status_code == 404

    logs = client.get("/audit-logs", headers={"X-Space-Id": "sx"}).json()
    assert any(log["action"] == "category.deleted" for log in logs)
