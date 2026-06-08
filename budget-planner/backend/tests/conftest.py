"""Fixture pytest: DB SQLite tạm + TestClient + helper xác thực.

Đặt biến môi trường DB **trước** khi import app để toàn bộ (get_db, event
handler) cùng trỏ vào DB test.
"""

from __future__ import annotations

import os
import tempfile
from collections.abc import Iterator

import pytest

# Quan trọng: set trước khi import app.* để settings đọc đúng DB test.
_tmp_db = os.path.join(tempfile.gettempdir(), "bp_test.db")
os.environ["BP_DATABASE_URL"] = f"sqlite:///{_tmp_db}"

from fastapi.testclient import TestClient  # noqa: E402

from app.core.db import Base, engine  # noqa: E402
from app.main import app  # noqa: E402

PASSWORD = "password123"


@pytest.fixture(autouse=True)
def _fresh_db() -> Iterator[None]:
    """Tạo schema mới cho mỗi test, xoá sau khi xong (cô lập)."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client() -> Iterator[TestClient]:
    with TestClient(app) as c:
        yield c


@pytest.fixture
def register(client: TestClient):
    """Đăng ký + đăng nhập một user → trả dict {access, refresh, space_id, email, headers}.

    ``headers`` gồm Authorization Bearer + X-Space-Id (không gian riêng của user).
    """

    def _register(email: str = "owner@x.com", name: str = "Owner") -> dict:
        client.post("/auth/register", json={"email": email, "password": PASSWORD, "name": name})
        tok = client.post("/auth/login", data={"username": email, "password": PASSWORD}).json()
        access = tok["access_token"]
        auth = {"Authorization": f"Bearer {access}"}
        space_id = client.get("/spaces", headers=auth).json()[0]["id"]
        return {
            "access": access,
            "refresh": tok["refresh_token"],
            "space_id": space_id,
            "email": email,
            "headers": {**auth, "X-Space-Id": space_id},
        }

    return _register


@pytest.fixture
def owner(register) -> dict:
    """Một owner mặc định kèm không gian riêng."""
    return register()


@pytest.fixture
def make_member(client: TestClient, register):
    """Tạo user mới + mời vào không gian của ``owner`` với vai trò cho trước.

    Trả headers (Bearer của user mới + X-Space-Id của owner).
    """

    def _make(owner: dict, role: str, email: str) -> dict:
        register(email=email, name=email)
        client.post("/members", json={"email": email, "role": role}, headers=owner["headers"])
        access = client.post("/auth/login", data={"username": email, "password": PASSWORD}).json()[
            "access_token"
        ]
        return {
            "access": access,
            "email": email,
            "headers": {"Authorization": f"Bearer {access}", "X-Space-Id": owner["space_id"]},
        }

    return _make
