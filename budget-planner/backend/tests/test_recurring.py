"""Test Recurring (giao dịch định kỳ): advance + run_due + CRUD."""

from datetime import date, timedelta

from fastapi.testclient import TestClient

from app.services.recurring import advance


def test_advance() -> None:
    assert advance(date(2026, 6, 9), "daily") == date(2026, 6, 10)
    assert advance(date(2026, 6, 9), "weekly") == date(2026, 6, 16)
    assert advance(date(2026, 6, 9), "monthly") == date(2026, 7, 9)
    assert advance(date(2026, 1, 31), "monthly") == date(2026, 2, 28)  # clamp cuối tháng
    assert advance(date(2026, 12, 15), "monthly") == date(2027, 1, 15)  # sang năm


def _rule(client: TestClient, headers: dict, **kw):
    payload = {
        "name": "Tiền nhà",
        "amount": 3000000,
        "type": "expense",
        "category_name": "Hoá đơn",
        "frequency": "monthly",
        "start_date": "2026-06-01",
        **kw,
    }
    return client.post("/recurring", json=payload, headers=headers)


def test_create_recurring(client: TestClient, owner: dict) -> None:
    r = _rule(client, owner["headers"])
    assert r.status_code == 201
    b = r.json()
    assert b["name"] == "Tiền nhà"
    assert b["frequency"] == "monthly"
    assert b["next_run"] == "2026-06-01"
    assert b["active"] is True


def test_create_requires_member(client: TestClient, owner: dict, make_member) -> None:
    v = make_member(owner, role="viewer", email="v@x.com")
    assert _rule(client, v["headers"]).status_code == 403


def test_run_generates_catchup(client: TestClient, owner: dict) -> None:
    h = owner["headers"]
    today = date.today()
    start = (today - timedelta(days=3)).isoformat()
    _rule(
        client,
        h,
        name="Cà phê",
        amount=30000,
        frequency="daily",
        start_date=start,
        category_name="Ăn uống",
    )
    res = client.post("/recurring/run", headers=h).json()
    assert res["created"] == 4  # today-3, -2, -1, today

    txns = client.get("/transactions", headers=h).json()
    assert len([t for t in txns if t["category_name"] == "Ăn uống" and t["amount"] == 30000]) == 4
    rules = client.get("/recurring", headers=h).json()
    assert rules[0]["next_run"] > today.isoformat()


def test_run_updates_wallet_balance(client: TestClient, owner: dict) -> None:
    h = owner["headers"]
    wid = client.post(
        "/wallets", json={"name": "V", "type": "cash", "balance": 100000}, headers=h
    ).json()["id"]
    today = date.today()
    _rule(
        client,
        h,
        name="Chi",
        amount=10000,
        frequency="daily",
        start_date=today.isoformat(),
        wallet_id=wid,
        category_name="X",
    )
    client.post("/recurring/run", headers=h)
    assert client.get(f"/wallets/{wid}", headers=h).json()["balance"] == 90000


def test_end_date_deactivates(client: TestClient, owner: dict) -> None:
    h = owner["headers"]
    today = date.today()
    start = (today - timedelta(days=5)).isoformat()
    end = (today - timedelta(days=3)).isoformat()
    _rule(
        client,
        h,
        name="Hết",
        amount=1000,
        frequency="daily",
        start_date=start,
        end_date=end,
        category_name="X",
    )
    res = client.post("/recurring/run", headers=h).json()
    assert res["created"] == 3  # today-5, -4, -3 (=end)
    rules = client.get("/recurring", headers=h).json()
    assert rules[0]["active"] is False


def test_delete_recurring(client: TestClient, owner: dict) -> None:
    h = owner["headers"]
    rid = _rule(client, h).json()["id"]
    assert client.delete(f"/recurring/{rid}", headers=h).status_code == 204
    assert client.get(f"/recurring/{rid}", headers=h).status_code == 404
