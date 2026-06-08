"""Xác thực (JWT) + phân quyền (RBAC theo Membership).

- ``get_current_user`` — giải mã access token → User.
- ``get_current_membership`` — kiểm user là thành viên active của không gian (``X-Space-Id``).
- ``get_current_space_id`` — trả space_id đã xác thực (router cũ giữ nguyên chữ ký).
- ``require_min_role`` — factory dependency chặn nếu vai trò thấp hơn yêu cầu.
"""

from __future__ import annotations

from collections.abc import Callable

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.security import decode_token
from app.models import Membership, User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# Thứ tự vai trò: viewer < member < admin < owner.
ROLE_ORDER = {"viewer": 0, "member": 1, "admin": 2, "owner": 3}

_UNAUTHORIZED = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Không xác thực được",
    headers={"WWW-Authenticate": "Bearer"},
)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Giải mã access token → User; 401 nếu token sai/không phải access/user inactive."""
    try:
        payload = decode_token(token)
    except ValueError as exc:
        raise _UNAUTHORIZED from exc
    if payload.get("type") != "access":
        raise _UNAUTHORIZED
    user = db.get(User, payload.get("sub") or "")
    if user is None or not user.is_active:
        raise _UNAUTHORIZED
    return user


def get_current_membership(
    user: User = Depends(get_current_user),
    x_space_id: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> Membership:
    """Kiểm user là thành viên active của không gian (header X-Space-Id)."""
    if not x_space_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Thiếu header X-Space-Id"
        )
    membership = db.scalar(
        select(Membership).where(
            Membership.user_id == user.id,
            Membership.space_id == x_space_id,
            Membership.status == "active",
        )
    )
    if membership is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không có quyền truy cập không gian này",
        )
    return membership


def get_current_space_id(membership: Membership = Depends(get_current_membership)) -> str:
    """Trả space_id đã xác thực qua Membership."""
    return membership.space_id


def require_min_role(min_role: str) -> Callable[..., Membership]:
    """Factory: dependency chặn 403 nếu vai trò hiện tại thấp hơn ``min_role``."""

    def checker(membership: Membership = Depends(get_current_membership)) -> Membership:
        if ROLE_ORDER.get(membership.role, -1) < ROLE_ORDER[min_role]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Không đủ quyền thực hiện"
            )
        return membership

    return checker
