"""Router Members: quản lý thành viên của KHÔNG GIAN HIỆN TẠI (header X-Space-Id).

Quyền: xem = thành viên bất kỳ; mời/đổi vai trò/xoá = admin+.
Chỉ owner mới được gán/đổi vai trò ``owner``; không ai xoá/hạ owner.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models import AuditLog, Membership, User
from app.rbac import get_current_membership, require_min_role
from app.schemas.space import MemberInvite, MemberRead, RoleUpdate
from app.services.notification import add_notification

router = APIRouter(prefix="/members", tags=["members"])


def _get_member(db: Session, membership_id: str, space_id: str) -> Membership:
    """Lấy membership thuộc đúng không gian; 404 nếu không có."""
    member = db.get(Membership, membership_id)
    if member is None or member.space_id != space_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy thành viên"
        )
    return member


@router.get("", response_model=list[MemberRead])
def list_members(
    membership: Membership = Depends(get_current_membership),
    db: Session = Depends(get_db),
) -> list[MemberRead]:
    """Liệt kê thành viên của không gian hiện tại."""
    rows = db.execute(
        select(Membership, User)
        .join(User, User.id == Membership.user_id)
        .where(Membership.space_id == membership.space_id)
    ).all()
    return [
        MemberRead(
            id=m.id, user_id=m.user_id, email=u.email, name=u.name, role=m.role, status=m.status
        )
        for m, u in rows
    ]


@router.post("", response_model=MemberRead, status_code=status.HTTP_201_CREATED)
def invite_member(
    payload: MemberInvite,
    current: Membership = Depends(require_min_role("admin")),
    db: Session = Depends(get_db),
) -> MemberRead:
    """Mời một user (đã tồn tại) vào không gian hiện tại."""
    if payload.role == "owner" and current.role != "owner":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Chỉ owner mới gán owner")

    user = db.scalar(select(User).where(User.email == payload.email))
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Email chưa có tài khoản")

    existed = db.scalar(
        select(Membership).where(
            Membership.user_id == user.id, Membership.space_id == current.space_id
        )
    )
    if existed is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Đã là thành viên")

    member = Membership(
        user_id=user.id, space_id=current.space_id, role=payload.role, status="active"
    )
    db.add(member)
    db.add(
        AuditLog(
            space_id=current.space_id,
            actor_id=current.user_id,
            action="member.invited",
            target=user.id,
        )
    )
    add_notification(
        db,
        current.space_id,
        "member.invited",
        f"{user.email} được mời vào nhóm với vai trò {payload.role}",
    )
    db.commit()
    db.refresh(member)
    return MemberRead(
        id=member.id,
        user_id=user.id,
        email=user.email,
        name=user.name,
        role=member.role,
        status=member.status,
    )


@router.patch("/{membership_id}", response_model=MemberRead)
def update_member_role(
    membership_id: str,
    payload: RoleUpdate,
    current: Membership = Depends(require_min_role("admin")),
    db: Session = Depends(get_db),
) -> MemberRead:
    """Đổi vai trò một thành viên."""
    member = _get_member(db, membership_id, current.space_id)
    if member.role == "owner":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Không đổi vai trò owner")
    if payload.role == "owner" and current.role != "owner":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Chỉ owner mới gán owner")

    member.role = payload.role
    db.add(
        AuditLog(
            space_id=current.space_id,
            actor_id=current.user_id,
            action="member.role_changed",
            target=member.user_id,
        )
    )
    db.commit()
    db.refresh(member)
    user = db.get(User, member.user_id)
    return MemberRead(
        id=member.id,
        user_id=member.user_id,
        email=user.email if user else "",
        name=user.name if user else "",
        role=member.role,
        status=member.status,
    )


@router.delete("/{membership_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_member(
    membership_id: str,
    current: Membership = Depends(require_min_role("admin")),
    db: Session = Depends(get_db),
) -> None:
    """Xoá một thành viên khỏi không gian (không xoá owner)."""
    member = _get_member(db, membership_id, current.space_id)
    if member.role == "owner":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Không thể xoá owner")
    target_user = member.user_id
    db.delete(member)
    db.add(
        AuditLog(
            space_id=current.space_id,
            actor_id=current.user_id,
            action="member.removed",
            target=target_user,
        )
    )
    db.commit()
