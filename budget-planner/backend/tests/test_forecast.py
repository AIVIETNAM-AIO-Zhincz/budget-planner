"""Test engine dự báo (trung bình trượt + dải MAD; hàm thuần, không DB)."""

from pytest import approx

from app.services.forecast import forecast_series


def test_three_months_average() -> None:
    r = forecast_series([1_000_000, 2_000_000, 3_000_000])
    assert r["forecast"] == approx(2_000_000)
    assert r["months_used"] == 3
    # MAD = (1tr + 0 + 1tr)/3 ≈ 0,667tr
    assert r["low"] == approx(2_000_000 - 2_000_000 / 3)
    assert r["high"] == approx(2_000_000 + 2_000_000 / 3)


def test_window_limits_to_last_3() -> None:
    r = forecast_series([10, 10, 1_000_000, 2_000_000, 3_000_000])
    assert r["forecast"] == approx(2_000_000)  # chỉ lấy 3 tháng cuối
    assert r["months_used"] == 3


def test_fewer_than_window() -> None:
    r = forecast_series([2_000_000, 4_000_000])
    assert r["forecast"] == approx(3_000_000)
    assert r["months_used"] == 2


def test_single_month() -> None:
    r = forecast_series([5_000_000])
    assert r["forecast"] == approx(5_000_000)
    assert r["low"] == approx(5_000_000) and r["high"] == approx(5_000_000)  # mad=0
    assert r["months_used"] == 1


def test_empty_series() -> None:
    r = forecast_series([])
    assert r["forecast"] is None
    assert r["months_used"] == 0


def test_equal_values_mad_zero() -> None:
    r = forecast_series([3_000_000, 3_000_000, 3_000_000])
    assert r["low"] == approx(3_000_000) and r["high"] == approx(3_000_000)


def test_low_clamped_nonnegative() -> None:
    r = forecast_series([0, 0, 3_000_000])
    assert r["low"] == 0  # mean−mad < 0 → kẹp về 0
