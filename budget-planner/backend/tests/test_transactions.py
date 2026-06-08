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


def _create(client: TestClient, headers: dict, **kw) -> dict:
    """Helper: tạo giao dịch, trả về body."""
    payload = {"amount": 1000, "note": "x", **kw}
    return client.post("/transactions", json=payload, headers=headers).json()


def test_update_transaction(client: TestClient, owner: dict) -> None:
    tx = _create(client, owner["headers"], amount=1000, note="cũ")
    r = client.patch(
        f"/transactions/{tx['id']}", json={"amount": 2000, "note": "mới"}, headers=owner["headers"]
    )
    assert r.status_code == 200
    assert r.json()["amount"] == 2000
    assert r.json()["note"] == "mới"


def test_update_viewer_forbidden(client: TestClient, owner: dict, make_member) -> None:
    tx = _create(client, owner["headers"])
    v = make_member(owner, role="viewer", email="v@x.com")
    r = client.patch(f"/transactions/{tx['id']}", json={"amount": 5}, headers=v["headers"])
    assert r.status_code == 403


def test_update_cross_space_404(client: TestClient, register) -> None:
    u1 = register(email="u1@x.com")
    u2 = register(email="u2@x.com")
    tx = _create(client, u1["headers"])
    r = client.patch(f"/transactions/{tx['id']}", json={"amount": 5}, headers=u2["headers"])
    assert r.status_code == 404


def test_delete_transaction(client: TestClient, owner: dict) -> None:
    tx = _create(client, owner["headers"])
    assert client.delete(f"/transactions/{tx['id']}", headers=owner["headers"]).status_code == 204
    assert client.get(f"/transactions/{tx['id']}", headers=owner["headers"]).status_code == 404

    logs = client.get("/audit-logs", headers=owner["headers"]).json()
    assert any(log["action"] == "transaction.deleted" for log in logs)


def test_delete_viewer_forbidden(client: TestClient, owner: dict, make_member) -> None:
    tx = _create(client, owner["headers"])
    v = make_member(owner, role="viewer", email="v@x.com")
    assert client.delete(f"/transactions/{tx['id']}", headers=v["headers"]).status_code == 403


def test_filter_by_type(client: TestClient, owner: dict) -> None:
    _create(client, owner["headers"], amount=10, type="expense", note="a")
    _create(client, owner["headers"], amount=20, type="income", note="b")
    items = client.get("/transactions?type=income", headers=owner["headers"]).json()
    assert len(items) == 1
    assert items[0]["type"] == "income"


def test_filter_by_category(client: TestClient, owner: dict) -> None:
    _create(client, owner["headers"], note="x", category_name="Ăn uống")
    _create(client, owner["headers"], note="y", category_name="Đi lại")
    items = client.get(
        "/transactions", params={"category": "Ăn uống"}, headers=owner["headers"]
    ).json()
    assert len(items) == 1
    assert items[0]["category_name"] == "Ăn uống"


def test_filter_by_month(client: TestClient, owner: dict) -> None:
    _create(client, owner["headers"], note="a", date="2026-06-10")
    _create(client, owner["headers"], note="b", date="2026-05-10")
    items = client.get("/transactions?month=2026-06", headers=owner["headers"]).json()
    assert len(items) == 1
    assert items[0]["date"] == "2026-06-10"


def test_search_by_note(client: TestClient, owner: dict) -> None:
    _create(client, owner["headers"], note="ăn trưa cùng team")
    _create(client, owner["headers"], note="đổ xăng")
    items = client.get("/transactions", params={"q": "trưa"}, headers=owner["headers"]).json()
    assert len(items) == 1


def _make_wallet(client: TestClient, headers: dict, balance: float = 0) -> str:
    return client.post(
        "/wallets", json={"name": "V", "type": "cash", "balance": balance}, headers=headers
    ).json()["id"]


def _balance(client: TestClient, headers: dict, wid: str) -> float:
    return client.get(f"/wallets/{wid}", headers=headers).json()["balance"]


def test_expense_decreases_wallet_balance(client: TestClient, owner: dict) -> None:
    wid = _make_wallet(client, owner["headers"], balance=100000)
    _create(client, owner["headers"], amount=30000, type="expense", wallet_id=wid)
    assert _balance(client, owner["headers"], wid) == 70000


def test_income_increases_wallet_balance(client: TestClient, owner: dict) -> None:
    wid = _make_wallet(client, owner["headers"], balance=0)
    _create(client, owner["headers"], amount=50000, type="income", wallet_id=wid)
    assert _balance(client, owner["headers"], wid) == 50000


def test_edit_amount_reflects_balance(client: TestClient, owner: dict) -> None:
    wid = _make_wallet(client, owner["headers"], balance=100000)
    tx = _create(client, owner["headers"], amount=30000, type="expense", wallet_id=wid)
    client.patch(f"/transactions/{tx['id']}", json={"amount": 50000}, headers=owner["headers"])
    assert _balance(client, owner["headers"], wid) == 50000


def test_change_wallet_moves_effect(client: TestClient, owner: dict) -> None:
    a = _make_wallet(client, owner["headers"], balance=100000)
    b = _make_wallet(client, owner["headers"], balance=100000)
    tx = _create(client, owner["headers"], amount=30000, type="expense", wallet_id=a)
    client.patch(f"/transactions/{tx['id']}", json={"wallet_id": b}, headers=owner["headers"])
    assert _balance(client, owner["headers"], a) == 100000
    assert _balance(client, owner["headers"], b) == 70000


def test_delete_restores_balance(client: TestClient, owner: dict) -> None:
    wid = _make_wallet(client, owner["headers"], balance=100000)
    tx = _create(client, owner["headers"], amount=30000, type="expense", wallet_id=wid)
    client.delete(f"/transactions/{tx['id']}", headers=owner["headers"])
    assert _balance(client, owner["headers"], wid) == 100000
