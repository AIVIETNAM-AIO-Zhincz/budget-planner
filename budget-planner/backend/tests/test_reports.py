"""Test API Reports (tổng hợp + xuất CSV)."""

from fastapi.testclient import TestClient


def _tx(client: TestClient, headers: dict, amount: float, tx_type: str, cat: str, d: str) -> None:
    client.post(
        "/transactions",
        json={"amount": amount, "type": tx_type, "note": "x", "category_name": cat, "date": d},
        headers=headers,
    )


def test_summary(client: TestClient, owner: dict) -> None:
    h = owner["headers"]
    _tx(client, h, 100000, "expense", "Ăn uống", "2026-06-01")
    _tx(client, h, 50000, "expense", "Ăn uống", "2026-06-02")
    _tx(client, h, 30000, "expense", "Đi lại", "2026-06-02")
    _tx(client, h, 15000000, "income", "Lương", "2026-06-01")

    r = client.get("/reports/summary", params={"from": "2026-06-01", "to": "2026-06-30"}, headers=h)
    assert r.status_code == 200
    b = r.json()
    assert b["total_income"] == 15000000
    assert b["total_expense"] == 180000
    assert b["balance"] == 14820000
    assert b["by_category"][0]["name"] == "Ăn uống"
    assert b["by_category"][0]["amount"] == 150000
    assert b["by_category"][1]["name"] == "Đi lại"
    days = {d["date"]: d for d in b["by_day"]}
    assert days["2026-06-01"]["expense"] == 100000
    assert days["2026-06-01"]["income"] == 15000000
    assert days["2026-06-02"]["expense"] == 80000


def test_summary_range_filter(client: TestClient, owner: dict) -> None:
    h = owner["headers"]
    _tx(client, h, 100000, "expense", "A", "2026-06-10")
    _tx(client, h, 50000, "expense", "A", "2026-05-10")
    r = client.get("/reports/summary", params={"from": "2026-06-01", "to": "2026-06-30"}, headers=h)
    assert r.json()["total_expense"] == 100000


def test_export_csv(client: TestClient, owner: dict) -> None:
    h = owner["headers"]
    _tx(client, h, 100000, "expense", "Ăn uống", "2026-06-10")
    r = client.get("/reports/export.csv", headers=h)
    assert r.status_code == 200
    assert "text/csv" in r.headers["content-type"]
    assert "attachment" in r.headers.get("content-disposition", "")
    assert "100000" in r.text
    assert "Ăn uống" in r.text


def test_reports_requires_token(client: TestClient) -> None:
    assert client.get("/reports/summary").status_code == 401
