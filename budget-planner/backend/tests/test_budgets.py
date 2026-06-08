"""Test API Budgets (Full CRUD + spent/remaining/percent, cần xác thực)."""

from fastapi.testclient import TestClient


def _make_category(client: TestClient, headers: dict, name: str) -> str:
    """Helper: tạo danh mục, trả id."""
    return client.post(
        "/categories", json={"name": name, "type": "expense"}, headers=headers
    ).json()["id"]


def test_create_budget(client: TestClient, owner: dict) -> None:
    """Tạo ngân sách → 201, spent_amount=0 ban đầu."""
    resp = client.post(
        "/budgets", json={"period": "2026-06", "limit_amount": 100000}, headers=owner["headers"]
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["period"] == "2026-06"
    assert body["limit_amount"] == 100000
    assert body["spent_amount"] == 0
    assert body["remaining"] == 100000
    assert body["id"]


def test_invalid_period_rejected(client: TestClient, owner: dict) -> None:
    """period sai định dạng YYYY-MM → 422."""
    resp = client.post(
        "/budgets", json={"period": "2026-6", "limit_amount": 100000}, headers=owner["headers"]
    )
    assert resp.status_code == 422


def test_limit_must_be_positive(client: TestClient, owner: dict) -> None:
    """limit_amount ≤ 0 → 422."""
    resp = client.post(
        "/budgets", json={"period": "2026-06", "limit_amount": 0}, headers=owner["headers"]
    )
    assert resp.status_code == 422


def test_list_budget_computes_spent(client: TestClient, owner: dict) -> None:
    """GET /budgets tính spent theo danh mục + period."""
    h = owner["headers"]
    cid = _make_category(client, h, "Ăn uống")
    client.post(
        "/budgets",
        json={"period": "2026-06", "limit_amount": 200000, "category_id": cid},
        headers=h,
    )
    for amt in (90000, 60000):
        client.post(
            "/transactions",
            json={"amount": amt, "note": "ăn", "category_name": "Ăn uống", "date": "2026-06-10"},
            headers=h,
        )
    # Một giao dịch ngoài period → không tính.
    client.post(
        "/transactions",
        json={"amount": 50000, "note": "ăn", "category_name": "Ăn uống", "date": "2026-05-10"},
        headers=h,
    )

    items = client.get("/budgets", headers=h).json()
    assert len(items) == 1
    b = items[0]
    assert b["spent_amount"] == 150000
    assert b["remaining"] == 50000
    assert b["percent"] == 75


def test_update_budget_limit(client: TestClient, owner: dict) -> None:
    """PATCH đổi limit_amount."""
    bid = client.post(
        "/budgets", json={"period": "2026-06", "limit_amount": 100000}, headers=owner["headers"]
    ).json()["id"]
    resp = client.patch(f"/budgets/{bid}", json={"limit_amount": 250000}, headers=owner["headers"])
    assert resp.status_code == 200
    assert resp.json()["limit_amount"] == 250000


def test_delete_budget(client: TestClient, owner: dict) -> None:
    """DELETE → 204 rồi GET → 404; ghi audit log."""
    bid = client.post(
        "/budgets", json={"period": "2026-06", "limit_amount": 100000}, headers=owner["headers"]
    ).json()["id"]

    assert client.delete(f"/budgets/{bid}", headers=owner["headers"]).status_code == 204
    assert client.get(f"/budgets/{bid}", headers=owner["headers"]).status_code == 404

    logs = client.get("/audit-logs", headers=owner["headers"]).json()
    assert any(log["action"] == "budget.deleted" for log in logs)
