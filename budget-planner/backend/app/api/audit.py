"""Router xem audit log (lọc theo space_id)."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models import AuditLog
from app.rbac import get_current_space_id

router = APIRouter(prefix="/audit-logs", tags=["audit"])


class AuditLogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    action: str
    target: str


@router.get("", response_model=list[AuditLogRead])
def list_audit_logs(
    db: Session = Depends(get_db),
    space_id: str = Depends(get_current_space_id),
) -> list[AuditLog]:
    stmt = select(AuditLog).where(AuditLog.space_id == space_id)
    return list(db.scalars(stmt))
