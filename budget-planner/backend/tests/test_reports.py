"""Test API Reports (tổng hợp + xuất CSV)."""

from datetime import date, timedelta

from fastapi.testclient import TestClient


def _month_ago(n: int) -> date:
    """Ngày giữa tháng cách hiện tại n tháng (cho test dự báo)."""
    today = date.today()
    m, y = today.month - n, today.year
    while m <= 0:
        m += 12
        y -= 1
    return date(y, m, 15)


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


def test_allocation_assessment(client: TestClient, owner: dict) -> None:
    """Đánh giá 50/30/20 từ thu/chi thực tế + need_level của danh mục."""
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
    _tx(client, h, 20000000, "income", "Lương", "2026-06-01")
    _tx(client, h, 9000000, "expense", "Tiền nhà", "2026-06-02")  # mandatory 45%
    _tx(client, h, 2000000, "expense", "Vô danh", "2026-06-03")  # optional 10%
    _tx(client, h, 1000000, "expense", "Cà phê", "2026-06-04")  # wasteful

    r = client.get(
        "/reports/allocation", params={"from": "2026-06-01", "to": "2026-06-30"}, headers=h
    )
    assert r.status_code == 200
    b = r.json()
    assert b["income"] == 20000000
    assert b["expense"] == 12000000
    assert b["savings"] == 8000000
    assert b["wasteful"] == 1000000
    assert b["verdict"] == "warning"  # 3 nhóm đạt nhưng có lãng phí
    g = {x["key"]: x for x in b["groups"]}
    assert g["needs"]["ok"] and g["wants"]["ok"] and g["savings"]["ok"]
    assert b["suggested_savings"] == 4000000
    assert any("lãng phí" in f.lower() for f in b["findings"])


def test_allocation_requires_token(client: TestClient) -> None:
    assert client.get("/reports/allocation").status_code == 401


def test_forecast(client: TestClient, owner: dict) -> None:
    """Dự báo = trung bình 3 tháng gần nhất (tổng + theo danh mục)."""
    h = owner["headers"]
    for n, amt in ((3, 1_000_000), (2, 2_000_000), (1, 3_000_000)):
        _tx(client, h, amt, "expense", "Ăn uống", _month_ago(n).isoformat())
    r = client.get("/reports/forecast", headers=h)
    assert r.status_code == 200
    b = r.json()
    assert b["months_used"] == 3
    assert b["total_forecast"] == 2_000_000  # (1+2+3)/3 tr
    cats = {c["name"]: c for c in b["by_category"]}
    assert "Ăn uống" in cats
    assert cats["Ăn uống"]["forecast"] == 2_000_000


def test_forecast_requires_token(client: TestClient) -> None:
    assert client.get("/reports/forecast").status_code == 401


def test_weekly_summary(client: TestClient, owner: dict) -> None:
    """Tóm tắt tuần: thu/chi/net + cảnh báo danh mục chi vọt so tuần trước."""
    h = owner["headers"]
    today = date.today()
    # Tuần trước: Ăn uống 1tr; tuần này: Ăn uống 3tr + lương 10tr.
    _tx(client, h, 1_000_000, "expense", "Ăn uống", (today - timedelta(days=9)).isoformat())
    _tx(client, h, 3_000_000, "expense", "Ăn uống", (today - timedelta(days=1)).isoformat())
    _tx(client, h, 10_000_000, "income", "Lương", (today - timedelta(days=1)).isoformat())
    r = client.get("/reports/weekly-summary", headers=h)
    assert r.status_code == 200
    b = r.json()
    assert b["income"] == 10_000_000 and b["expense"] == 3_000_000 and b["net"] == 7_000_000
    anomalies = {a["name"]: a for a in b["anomalies"]}
    assert "Ăn uống" in anomalies and anomalies["Ăn uống"]["current"] == 3_000_000
    assert "Tuần qua" in b["text"]


def test_weekly_summary_requires_token(client: TestClient) -> None:
    assert client.get("/reports/weekly-summary").status_code == 401


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
