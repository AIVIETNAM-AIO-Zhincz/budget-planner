"""Router Categories (Full CRUD, lọc theo space_id)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models import AuditLog, Category, User
from app.rbac import get_current_space_id, get_current_user, require_min_role
from app.schemas.category import CategoryCreate, CategoryRead, CategoryUpdate

router = APIRouter(prefix="/categories", tags=["categories"])


def _get_owned(db: Session, category_id: str, space_id: str) -> Category:
    """Lấy danh mục thuộc đúng không gian, không có → 404."""
    category = db.get(Category, category_id)
    if category is None or category.space_id != space_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy danh mục")
    return category


@router.post(
    "",
    response_model=CategoryRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_min_role("admin"))],
)
def create_category(
    payload: CategoryCreate,
    db: Session = Depends(get_db),
    space_id: str = Depends(get_current_space_id),
) -> Category:
    """Tạo danh mục mới cho không gian hiện tại."""
    category = Category(
        space_id=space_id,
        name=payload.name,
        type=payload.type,
        parent_id=payload.parent_id,
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.get("", response_model=list[CategoryRead])
def list_categories(
    db: Session = Depends(get_db),
    space_id: str = Depends(get_current_space_id),
) -> list[Category]:
    """Liệt kê danh mục của không gian hiện tại."""
    stmt = select(Category).where(Category.space_id == space_id)
    return list(db.scalars(stmt))


@router.get("/{category_id}", response_model=CategoryRead)
def get_category(
    category_id: str,
    db: Session = Depends(get_db),
    space_id: str = Depends(get_current_space_id),
) -> Category:
    """Xem một danh mục (cô lập theo space_id)."""
    return _get_owned(db, category_id, space_id)


@router.patch(
    "/{category_id}",
    response_model=CategoryRead,
    dependencies=[Depends(require_min_role("admin"))],
)
def update_category(
    category_id: str,
    payload: CategoryUpdate,
    db: Session = Depends(get_db),
    space_id: str = Depends(get_current_space_id),
) -> Category:
    """Cập nhật danh mục (partial)."""
    category = _get_owned(db, category_id, space_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(category, field, value)
    db.commit()
    db.refresh(category)
    return category


@router.delete(
    "/{category_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_min_role("admin"))],
)
def delete_category(
    category_id: str,
    db: Session = Depends(get_db),
    space_id: str = Depends(get_current_space_id),
    user: User = Depends(get_current_user),
) -> None:
    """Xoá danh mục + ghi audit log (hành động nhạy cảm)."""
    category = _get_owned(db, category_id, space_id)
    db.delete(category)
    db.add(
        AuditLog(space_id=space_id, actor_id=user.id, action="category.deleted", target=category_id)
    )
    db.commit()
