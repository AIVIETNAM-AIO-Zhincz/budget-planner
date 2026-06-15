"""Test engine khả thi mục tiêu (hàm thuần, không DB)."""

from app.services.goal import assess_goal, parse_timeframe_months


def test_parse_timeframe_months() -> None:
    assert parse_timeframe_months("để dành 100tr trong 2 năm") == 24
    assert parse_timeframe_months("trong 18 tháng") == 18
    assert parse_timeframe_months("6 tháng nữa") == 6
    assert parse_timeframe_months("1 năm") == 12
    assert parse_timeframe_months("không có mốc thời gian") is None


def test_assess_done() -> None:
    a = assess_goal(100_000_000, 100_000_000, 5_000_000)
    assert a["verdict"] == "done"
    assert a["remaining"] == 0


def test_assess_no_surplus() -> None:
    a = assess_goal(60_000_000, 0, 0)
    assert a["verdict"] == "no_surplus"
    assert a["months_needed"] is None


def test_assess_on_track_no_deadline() -> None:
    a = assess_goal(60_000_000, 0, 5_000_000)
    assert a["verdict"] == "on_track"
    assert a["months_needed"] == 12
    assert a["feasible"] is None


def test_assess_on_track_with_deadline() -> None:
    a = assess_goal(60_000_000, 0, 5_000_000, months_left=24)
    assert a["verdict"] == "on_track"
    assert a["feasible"] is True
    assert a["required_monthly"] == 2_500_000


def test_assess_tight_deadline() -> None:
    a = assess_goal(60_000_000, 0, 5_000_000, months_left=6)
    assert a["verdict"] == "tight"
    assert a["feasible"] is False
    assert a["required_monthly"] == 10_000_000


def test_assess_deadline_passed() -> None:
    a = assess_goal(60_000_000, 0, 5_000_000, months_left=0)
    assert a["verdict"] == "tight"
    assert a["feasible"] is False
    assert a["required_monthly"] == 60_000_000


def test_assess_months_needed_ceil() -> None:
    a = assess_goal(10_000_000, 0, 3_000_000)
    assert a["months_needed"] == 4  # ceil(10/3)
