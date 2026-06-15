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


def test_create_category_default_need_level(client: TestClient, owner: dict) -> None:
    """Không gửi need_level → mặc định 'optional'."""
    resp = client.post(
        "/categories", json={"name": "X", "type": "expense"}, headers=owner["headers"]
    )
    assert resp.status_code == 201
    assert resp.json()["need_level"] == "optional"


def test_create_category_with_need_level(client: TestClient, owner: dict) -> None:
    """Gửi need_level hợp lệ → lưu đúng; cập nhật được."""
    resp = client.post(
        "/categories",
        json={"name": "Tiền nhà", "type": "expense", "need_level": "mandatory"},
        headers=owner["headers"],
    )
    assert resp.status_code == 201
    cid = resp.json()["id"]
    assert resp.json()["need_level"] == "mandatory"

    upd = client.patch(
        f"/categories/{cid}", json={"need_level": "wasteful"}, headers=owner["headers"]
    )
    assert upd.status_code == 200
    assert upd.json()["need_level"] == "wasteful"


def test_create_category_invalid_need_level_rejected(client: TestClient, owner: dict) -> None:
    """need_level ngoài tập hợp → 422."""
    resp = client.post(
        "/categories",
        json={"name": "Y", "type": "expense", "need_level": "luxury"},
        headers=owner["headers"],
    )
    assert resp.status_code == 422


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


def test_list_categories_includes_tx_stats(client: TestClient, owner: dict) -> None:
    """GET /categories trả kèm tx_count + tx_total theo tên danh mục."""
    h = owner["headers"]
    client.post("/categories", json={"name": "Ăn uống", "type": "expense"}, headers=h)
    client.post(
        "/transactions",
        json={"amount": 50000, "category_name": "Ăn uống", "note": "x"},
        headers=h,
    )
    client.post(
        "/transactions",
        json={"amount": 30000, "category_name": "Ăn uống", "note": "y"},
        headers=h,
    )
    cats = client.get("/categories", headers=h).json()
    cat = next(c for c in cats if c["name"] == "Ăn uống")
    assert cat["tx_count"] == 2
    assert cat["tx_total"] == 80000
