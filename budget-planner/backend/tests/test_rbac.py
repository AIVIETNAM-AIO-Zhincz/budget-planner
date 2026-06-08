"""Test phân quyền RBAC theo vai trò (viewer/member/admin/owner)."""

from fastapi.testclient import TestClient


def test_viewer_can_read_not_write(client: TestClient, owner: dict, make_member) -> None:
    """Viewer xem được nhưng không tạo giao dịch (403)."""
    v = make_member(owner, role="viewer", email="v@x.com")
    assert client.get("/transactions", headers=v["headers"]).status_code == 200
    assert (
        client.post(
            "/transactions", json={"amount": 10, "note": "x"}, headers=v["headers"]
        ).status_code
        == 403
    )


def test_member_can_transact_not_manage_categories(
    client: TestClient, owner: dict, make_member
) -> None:
    """Member tạo giao dịch OK nhưng không tạo danh mục (cần admin)."""
    m = make_member(owner, role="member", email="m@x.com")
    assert (
        client.post(
            "/transactions", json={"amount": 10, "note": "x"}, headers=m["headers"]
        ).status_code
        == 201
    )
    assert client.post("/categories", json={"name": "A"}, headers=m["headers"]).status_code == 403


def test_member_cannot_manage_budgets(client: TestClient, owner: dict, make_member) -> None:
    m = make_member(owner, role="member", email="m@x.com")
    r = client.post(
        "/budgets", json={"period": "2026-06", "limit_amount": 1000}, headers=m["headers"]
    )
    assert r.status_code == 403


def test_admin_can_manage_categories(client: TestClient, owner: dict, make_member) -> None:
    a = make_member(owner, role="admin", email="a@x.com")
    assert client.post("/categories", json={"name": "A"}, headers=a["headers"]).status_code == 201


def test_non_member_forbidden(client: TestClient, owner: dict, register) -> None:
    """User không thuộc không gian → 403 khi truy cập bằng X-Space-Id của owner."""
    other = register(email="o2@x.com")
    headers = {"Authorization": f"Bearer {other['access']}", "X-Space-Id": owner["space_id"]}
    assert client.get("/transactions", headers=headers).status_code == 403
