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


def test_summary_by_need_level(client: TestClient, owner: dict) -> None:
    """Chi gộp theo mức cần thiết của danh mục; giao dịch không khớp → 'optional'."""
    h = owner["headers"]
    client.post(
        "/categories",
        json={"name": "Tiền nhà", "type": "expense", "need_level": "mandatory"},
        headers=h,
    )
    client.post(
        "/categories",
        json={"name": "Cà phê", "type": "expense", "need_level": "wasteful"},
        headers=h,
    )
    _tx(client, h, 5000000, "expense", "Tiền nhà", "2026-06-01")
    _tx(client, h, 50000, "expense", "Cà phê", "2026-06-02")
    _tx(client, h, 30000, "expense", "Vô danh", "2026-06-02")  # không có danh mục → optional

    r = client.get("/reports/summary", headers=h)
    assert r.status_code == 200
    nl = {x["need_level"]: x["amount"] for x in r.json()["by_need_level"]}
    assert nl["mandatory"] == 5000000
    assert nl["wasteful"] == 50000
    assert nl["optional"] == 30000


def test_annual_summary(client: TestClient, owner: dict) -> None:
    """12 tháng: thu/chi đúng tháng, balance luỹ kế, tháng trống = 0."""
    h = owner["headers"]
    _tx(client, h, 1000000, "income", "Lương", "2026-01-05")
    _tx(client, h, 400000, "expense", "Ăn uống", "2026-01-20")
    _tx(client, h, 2000000, "income", "Lương", "2026-03-05")
    _tx(client, h, 500000, "expense", "Ăn uống", "2026-03-10")
    _tx(client, h, 999999, "income", "Lương", "2025-12-31")  # khác năm → không tính

    b = client.get("/reports/annual?year=2026", headers=h).json()
    assert b["year"] == 2026
    assert len(b["months"]) == 12
    by_month = {m["month"]: m for m in b["months"]}
    assert by_month["2026-01"]["income"] == 1000000
    assert by_month["2026-01"]["expense"] == 400000
    assert by_month["2026-01"]["balance"] == 600000  # luỹ kế T1
    assert (
        by_month["2026-02"]["income"] == 0 and by_month["2026-02"]["balance"] == 600000
    )  # T2 trống
    assert by_month["2026-03"]["balance"] == 600000 + (2000000 - 500000)  # luỹ kế T3
    assert b["months"][11]["balance"] == 2100000  # cuối năm


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
