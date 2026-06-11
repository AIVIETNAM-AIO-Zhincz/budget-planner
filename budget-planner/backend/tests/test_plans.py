"""Test API Kế hoạch tháng (planned thu/chi vs actual, cô lập space, RBAC)."""

from fastapi.testclient import TestClient


def _tx(client: TestClient, headers: dict, amount: float, tx_type: str, d: str) -> None:
    client.post(
        "/transactions",
        json={"amount": amount, "type": tx_type, "note": "x", "date": d},
        headers=headers,
    )


def test_default_plan_zero_with_actuals(client: TestClient, owner: dict) -> None:
    """Chưa đặt kế hoạch → planned 0; actual lấy từ giao dịch trong tháng."""
    h = owner["headers"]
    _tx(client, h, 5000000, "income", "2026-06-05")
    _tx(client, h, 1200000, "expense", "2026-06-10")
    _tx(client, h, 999, "expense", "2026-05-10")  # ngoài tháng → không tính

    b = client.get("/monthly-plan/2026-06", headers=h).json()
    assert b["planned_income"] == 0 and b["planned_expense"] == 0
    assert b["actual_income"] == 5000000 and b["actual_expense"] == 1200000


def test_upsert_then_get(client: TestClient, owner: dict) -> None:
    """PUT đặt kế hoạch (upsert) → GET trả planned mới nhất + actual."""
    h = owner["headers"]
    _tx(client, h, 5000000, "income", "2026-06-05")
    put = client.put(
        "/monthly-plan/2026-06",
        json={"planned_income": 6000000, "planned_expense": 4000000},
        headers=h,
    )
    assert put.status_code == 200
    assert put.json()["planned_income"] == 6000000
    assert put.json()["actual_income"] == 5000000

    client.put(
        "/monthly-plan/2026-06",
        json={"planned_income": 7000000, "planned_expense": 4500000},
        headers=h,
    )
    g = client.get("/monthly-plan/2026-06", headers=h).json()
    assert g["planned_income"] == 7000000 and g["planned_expense"] == 4500000


def test_isolated_by_space(client: TestClient, register) -> None:
    """Kế hoạch cô lập theo không gian."""
    u1 = register(email="a@x.com")
    u2 = register(email="b@x.com")
    client.put("/monthly-plan/2026-06", json={"planned_income": 1000}, headers=u1["headers"])
    g = client.get("/monthly-plan/2026-06", headers=u2["headers"]).json()
    assert g["planned_income"] == 0


def test_viewer_cannot_set_plan(client: TestClient, owner: dict, make_member) -> None:
    """Viewer không được đặt kế hoạch (PUT cần member+)."""
    v = make_member(owner, role="viewer", email="v@x.com")
    r = client.put("/monthly-plan/2026-06", json={"planned_income": 100}, headers=v["headers"])
    assert r.status_code == 403


def test_invalid_period_rejected(client: TestClient, owner: dict) -> None:
    """period sai định dạng → 422."""
    assert client.get("/monthly-plan/2026-6", headers=owner["headers"]).status_code == 422
