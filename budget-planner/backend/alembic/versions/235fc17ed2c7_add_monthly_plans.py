"""add monthly_plans

Revision ID: 235fc17ed2c7
Revises: 2e8056959549
Create Date: 2026-06-11 10:37:01.730188

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "235fc17ed2c7"
down_revision: str | Sequence[str] | None = "2e8056959549"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Tạo bảng monthly_plans (kế hoạch thu/chi theo tháng)."""
    op.create_table(
        "monthly_plans",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("space_id", sa.String(length=36), nullable=False),
        sa.Column("period", sa.String(length=7), nullable=False),
        sa.Column("planned_income", sa.Float(), nullable=False),
        sa.Column("planned_expense", sa.Float(), nullable=False),
        sa.ForeignKeyConstraint(["space_id"], ["spaces.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    with op.batch_alter_table("monthly_plans", schema=None) as batch_op:
        batch_op.create_index(
            batch_op.f("ix_monthly_plans_space_id"), ["space_id"], unique=False
        )


def downgrade() -> None:
    """Gỡ bảng monthly_plans."""
    with op.batch_alter_table("monthly_plans", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_monthly_plans_space_id"))
    op.drop_table("monthly_plans")
