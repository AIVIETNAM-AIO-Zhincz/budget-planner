"""Fixture pytest: DB SQLite tạm + TestClient.

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
