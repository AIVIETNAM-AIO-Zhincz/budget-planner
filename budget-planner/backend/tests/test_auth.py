"""Test xác thực: đăng ký, đăng nhập, refresh, bảo vệ endpoint."""

from fastapi.testclient import TestClient


def test_register_creates_user_and_space(client: TestClient, register) -> None:
    """Đăng ký tạo user + không gian riêng (owner)."""
    u = register(email="a@x.com", name="A")
    assert u["space_id"]
    me = client.get("/auth/me", headers={"Authorization": f"Bearer {u['access']}"})
    assert me.status_code == 200
    assert me.json()["email"] == "a@x.com"


def test_register_duplicate_email_409(client: TestClient) -> None:
    client.post("/auth/register", json={"email": "a@x.com", "password": "password123"})
    r = client.post("/auth/register", json={"email": "a@x.com", "password": "password123"})
    assert r.status_code == 409


def test_register_short_password_422(client: TestClient) -> None:
    r = client.post("/auth/register", json={"email": "a@x.com", "password": "short"})
    assert r.status_code == 422


def test_login_wrong_password_401(client: TestClient) -> None:
    client.post("/auth/register", json={"email": "a@x.com", "password": "password123"})
    r = client.post("/auth/login", data={"username": "a@x.com", "password": "sai-roi"})
    assert r.status_code == 401


def test_refresh_returns_new_access(client: TestClient, register) -> None:
    u = register(email="a@x.com")
    r = client.post("/auth/refresh", json={"refresh_token": u["refresh"]})
    assert r.status_code == 200
    assert r.json()["access_token"]


def test_refresh_rejects_access_token(client: TestClient, register) -> None:
    """Dùng access token cho /auth/refresh → 401 (sai loại token)."""
    u = register(email="a@x.com")
    r = client.post("/auth/refresh", json={"refresh_token": u["access"]})
    assert r.status_code == 401


def test_protected_endpoints_require_token(client: TestClient) -> None:
    assert client.get("/transactions").status_code == 401
    assert client.get("/categories").status_code == 401
    assert client.get("/budgets").status_code == 401


# Mật khẩu mới suy từ mật khẩu test (tránh hardcode thêm literal mật khẩu).
_CUR_PW = "password123"
_NEW_PW = _CUR_PW[::-1]


def test_change_password(client: TestClient, register) -> None:
    u = register(email="a@x.com")
    auth = {"Authorization": f"Bearer {u['access']}"}
    r = client.post(
        "/auth/change-password",
        json={"current_password": _CUR_PW, "new_password": _NEW_PW},
        headers=auth,
    )
    assert r.status_code == 204
    # mật khẩu cũ không còn dùng được, mật khẩu mới đăng nhập OK
    assert (
        client.post("/auth/login", data={"username": "a@x.com", "password": _CUR_PW}).status_code
        == 401
    )
    assert (
        client.post("/auth/login", data={"username": "a@x.com", "password": _NEW_PW}).status_code
        == 200
    )


def test_change_password_wrong_current_400(client: TestClient, register) -> None:
    u = register(email="a@x.com")
    r = client.post(
        "/auth/change-password",
        json={"current_password": "sai-roi", "new_password": _NEW_PW},
        headers={"Authorization": f"Bearer {u['access']}"},
    )
    assert r.status_code == 400


def test_change_password_too_short_422(client: TestClient, register) -> None:
    u = register(email="a@x.com")
    r = client.post(
        "/auth/change-password",
        json={"current_password": _CUR_PW, "new_password": "short"},
        headers={"Authorization": f"Bearer {u['access']}"},
    )
    assert r.status_code == 422


def test_update_profile_name(client: TestClient, register) -> None:
    u = register(email="a@x.com")
    r = client.patch(
        "/auth/me", json={"name": "Tên Mới"}, headers={"Authorization": f"Bearer {u['access']}"}
    )
    assert r.status_code == 200
    assert r.json()["name"] == "Tên Mới"
