"""Test API Transactions (vertical slice, event-driven)."""

from fastapi.testclient import TestClient


def test_create_transaction_suggests_category(client: TestClient) -> None:
    """Không gửi category_name → AI tự gợi ý từ note."""
    resp = client.post("/transactions", json={"amount": 50000, "note": "ăn trưa"})
    assert resp.status_code == 201
    body = resp.json()
    assert body["amount"] == 50000
    assert body["category_name"] == "Ăn uống"  # AI gợi ý
    assert body["id"]


def test_create_keeps_explicit_category(client: TestClient) -> None:
    resp = client.post(
        "/transactions",
        json={"amount": 100000, "note": "ăn tối", "category_name": "Giải trí"},
    )
    assert resp.status_code == 201
    assert resp.json()["category_name"] == "Giải trí"  # không bị AI ghi đè


def test_amount_must_be_positive(client: TestClient) -> None:
    resp = client.post("/transactions", json={"amount": -5, "note": "x"})
    assert resp.status_code == 422


def test_list_isolated_by_space(client: TestClient) -> None:
    """Giao dịch phải cô lập theo space_id (header X-Space-Id)."""
    client.post("/transactions", json={"amount": 10, "note": "a"}, headers={"X-Space-Id": "s1"})
    client.post("/transactions", json={"amount": 20, "note": "b"}, headers={"X-Space-Id": "s2"})

    r1 = client.get("/transactions", headers={"X-Space-Id": "s1"})
    assert r1.status_code == 200
    items = r1.json()
    assert len(items) == 1
    assert items[0]["amount"] == 10


def test_create_emits_event_writes_audit_log(client: TestClient) -> None:
    """Tạo giao dịch phát TransactionCreated → handler ghi audit log."""
    client.post("/transactions", json={"amount": 30, "note": "ăn"}, headers={"X-Space-Id": "sa"})

    resp = client.get("/audit-logs", headers={"X-Space-Id": "sa"})
    assert resp.status_code == 200
    logs = resp.json()
    assert any(log["action"] == "transaction.created" for log in logs)
