"""Test engine đánh giá phân bổ 50/30/20 (hàm thuần, không DB)."""

from pytest import approx

from app.services.allocation import assess_allocation


def _nl(mandatory: float = 0, optional: float = 0, wasteful: float = 0) -> list[dict]:
    return [
        {"need_level": "mandatory", "amount": mandatory},
        {"need_level": "optional", "amount": optional},
        {"need_level": "wasteful", "amount": wasteful},
    ]


def _groups(a: dict) -> dict:
    return {g["key"]: g for g in a["groups"]}


def test_good_allocation() -> None:
    a = assess_allocation(20_000_000, 11_000_000, _nl(mandatory=9_000_000, optional=2_000_000))
    assert a["verdict"] == "good"
    assert a["savings"] == 9_000_000
    assert a["savings_rate"] == approx(0.45)
    g = _groups(a)
    assert g["needs"]["ok"] and g["wants"]["ok"] and g["savings"]["ok"]
    assert g["needs"]["actual_pct"] == approx(0.45)


def test_low_savings_warning() -> None:
    a = assess_allocation(20_000_000, 18_000_000, _nl(mandatory=12_000_000, optional=6_000_000))
    assert a["verdict"] == "warning"
    assert _groups(a)["savings"]["ok"] is False
    assert any("tiết kiệm" in f.lower() for f in a["findings"])


def test_needs_over() -> None:
    a = assess_allocation(20_000_000, 12_000_000, _nl(mandatory=12_000_000))
    assert _groups(a)["needs"]["ok"] is False  # 60% > 50%
    assert a["verdict"] == "warning"


def test_wants_over() -> None:
    a = assess_allocation(20_000_000, 9_000_000, _nl(mandatory=2_000_000, optional=7_000_000))
    assert _groups(a)["wants"]["ok"] is False  # 35% > 30%
    assert a["verdict"] == "warning"


def test_wasteful_flagged() -> None:
    a = assess_allocation(
        20_000_000, 12_000_000, _nl(mandatory=9_000_000, optional=2_000_000, wasteful=1_000_000)
    )
    assert a["wasteful"] == 1_000_000
    assert a["verdict"] == "warning"  # wasteful>0 dù 3 nhóm đạt
    assert any("lãng phí" in f.lower() for f in a["findings"])


def test_no_income_unknown() -> None:
    a = assess_allocation(0, 5_000_000, _nl(mandatory=5_000_000))
    assert a["verdict"] == "unknown"
    assert a["suggested_needs"] == 0.0
    assert a["findings"]  # có câu hướng dẫn ghi thu nhập


def test_suggested_50_30_20() -> None:
    a = assess_allocation(20_000_000, 0, _nl())
    assert a["suggested_needs"] == approx(10_000_000)
    assert a["suggested_wants"] == approx(6_000_000)
    assert a["suggested_savings"] == approx(4_000_000)
