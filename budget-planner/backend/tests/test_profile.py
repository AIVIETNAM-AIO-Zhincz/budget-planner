"""Test Hồ sơ tài chính người dùng (/profile — per-user, upsert, validation)."""

from fastapi.testclient import TestClient


def test_get_profile_default_empty(client: TestClient, owner: dict) -> None:
    r = client.get("/profile", headers=owner["headers"])
    assert r.status_code == 200
    b = r.json()
    assert b["monthly_income"] is None
    assert b["dependents"] == 0
    assert b["age"] is None


def test_put_profile_upsert(client: TestClient, owner: dict) -> None:
    h = owner["headers"]
    r = client.put(
        "/profile",
        json={"monthly_income": 20000000, "occupation": "Kỹ sư", "age": 30, "dependents": 2},
        headers=h,
    )
    assert r.status_code == 200
    b = r.json()
    assert b["monthly_income"] == 20000000
    assert b["occupation"] == "Kỹ sư"
    assert b["dependents"] == 2
    # GET phản ánh; cập nhật một phần không xoá trường cũ.
    client.put("/profile", json={"age": 31}, headers=h)
    g = client.get("/profile", headers=h).json()
    assert g["age"] == 31
    assert g["monthly_income"] == 20000000  # giữ nguyên


def test_put_profile_validation(client: TestClient, owner: dict) -> None:
    h = owner["headers"]
    assert client.put("/profile", json={"age": 200}, headers=h).status_code == 422
    assert client.put("/profile", json={"dependents": -1}, headers=h).status_code == 422
    assert client.put("/profile", json={"monthly_income": -5}, headers=h).status_code == 422


def test_profile_requires_token(client: TestClient) -> None:
    assert client.get("/profile").status_code == 401
    assert client.put("/profile", json={"age": 30}).status_code == 401


def test_profile_isolated_per_user(client: TestClient, owner: dict, make_member) -> None:
    client.put("/profile", json={"monthly_income": 20000000}, headers=owner["headers"])
    member = make_member(owner, role="member", email="m@x.com")
    r = client.get("/profile", headers=member["headers"]).json()
    assert r["monthly_income"] is None  # hồ sơ của member tách biệt
