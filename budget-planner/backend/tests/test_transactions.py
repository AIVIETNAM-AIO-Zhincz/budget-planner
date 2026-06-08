"""Test API Transactions (vertical slice, event-driven, cần xác thực)."""

from fastapi.testclient import TestClient


def test_create_transaction_suggests_category(client: TestClient, owner: dict) -> None:
    """Không gửi category_name → AI tự gợi ý từ note."""
    resp = client.post(
        "/transactions", json={"amount": 50000, "note": "ăn trưa"}, headers=owner["headers"]
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["amount"] == 50000
    assert body["category_name"] == "Ăn uống"  # AI gợi ý
    assert body["id"]


def test_create_keeps_explicit_category(client: TestClient, owner: dict) -> None:
    resp = client.post(
        "/transactions",
        json={"amount": 100000, "note": "ăn tối", "category_name": "Giải trí"},
        headers=owner["headers"],
    )
    assert resp.status_code == 201
    assert resp.json()["category_name"] == "Giải trí"  # không bị AI ghi đè


def test_amount_must_be_positive(client: TestClient, owner: dict) -> None:
    resp = client.post("/transactions", json={"amount": -5, "note": "x"}, headers=owner["headers"])
    assert resp.status_code == 422


def test_list_isolated_by_space(client: TestClient, register) -> None:
    """Giao dịch cô lập theo không gian của từng user."""
    u1 = register(email="u1@x.com")
    u2 = register(email="u2@x.com")
    client.post("/transactions", json={"amount": 10, "note": "a"}, headers=u1["headers"])
    client.post("/transactions", json={"amount": 20, "note": "b"}, headers=u2["headers"])

    items = client.get("/transactions", headers=u1["headers"]).json()
    assert len(items) == 1
    assert items[0]["amount"] == 10


def test_create_emits_event_writes_audit_log(client: TestClient, owner: dict) -> None:
    """Tạo giao dịch phát TransactionCreated → handler ghi audit log (kèm actor_id)."""
    client.post("/transactions", json={"amount": 30, "note": "ăn"}, headers=owner["headers"])

    logs = client.get("/audit-logs", headers=owner["headers"]).json()
    assert any(log["action"] == "transaction.created" for log in logs)


def test_requires_token(client: TestClient) -> None:
    """Thiếu token → 401."""
    assert client.get("/transactions").status_code == 401
