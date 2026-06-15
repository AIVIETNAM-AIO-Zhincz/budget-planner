"""Test engine tóm tắt tuần + phát hiện bất thường (hàm thuần, không DB)."""

from datetime import date

from app.services.weekly import build_weekly_summary


def _w(start: date, end: date, income: float = 0.0, expense: float = 0.0, by=None) -> dict:
    return {
        "start": start,
        "end": end,
        "income": income,
        "expense": expense,
        "by_category": by or {},
    }


def test_normal_week() -> None:
    prior = _w(date(2026, 6, 1), date(2026, 6, 7), expense=2_000_000, by={"Ăn uống": 2_000_000})
    cur = _w(
        date(2026, 6, 8),
        date(2026, 6, 14),
        income=10_000_000,
        expense=3_000_000,
        by={"Ăn uống": 1_000_000, "Mua sắm": 2_000_000},
    )
    s = build_weekly_summary([prior, cur])
    assert s["income"] == 10_000_000 and s["expense"] == 3_000_000 and s["net"] == 7_000_000
    assert s["expense_change_pct"] == 50.0  # 3tr so 2tr
    assert s["top_categories"][0]["name"] == "Mua sắm"
    assert "Tuần qua" in s["text"]


def test_anomaly_detected() -> None:
    prior = [
        _w(date(2026, 5, 25), date(2026, 5, 31), expense=1_000_000, by={"Ăn uống": 1_000_000}),
        _w(date(2026, 6, 1), date(2026, 6, 7), expense=1_000_000, by={"Ăn uống": 1_000_000}),
    ]
    cur = _w(date(2026, 6, 8), date(2026, 6, 14), expense=3_000_000, by={"Ăn uống": 3_000_000})
    s = build_weekly_summary([*prior, cur])
    anomalies = {a["name"]: a for a in s["anomalies"]}
    assert "Ăn uống" in anomalies
    assert anomalies["Ăn uống"]["factor"] == 3.0  # 3tr / trung bình 1tr
    assert "bất thường" in s["text"]


def test_stable_no_anomaly() -> None:
    prior = [_w(date(2026, 6, 1), date(2026, 6, 7), expense=1_000_000, by={"Ăn uống": 1_000_000})]
    cur = _w(date(2026, 6, 8), date(2026, 6, 14), expense=1_100_000, by={"Ăn uống": 1_100_000})
    s = build_weekly_summary([*prior, cur])
    assert s["anomalies"] == []  # 1.1× < 1.5×


def test_below_floor_skipped() -> None:
    prior = [_w(date(2026, 6, 1), date(2026, 6, 7), expense=10_000, by={"Cà phê": 10_000})]
    cur = _w(date(2026, 6, 8), date(2026, 6, 14), expense=100_000, by={"Cà phê": 100_000})
    s = build_weekly_summary([*prior, cur])
    assert s["anomalies"] == []  # 100k < MIN_FLOOR 200k


def test_single_week_no_change() -> None:
    cur = _w(date(2026, 6, 8), date(2026, 6, 14), income=5_000_000, expense=2_000_000)
    s = build_weekly_summary([cur])
    assert s["expense_change_pct"] is None
    assert s["anomalies"] == []


def test_empty_week_text() -> None:
    s = build_weekly_summary([_w(date(2026, 6, 8), date(2026, 6, 14))])
    assert "chưa có giao dịch" in s["text"]
