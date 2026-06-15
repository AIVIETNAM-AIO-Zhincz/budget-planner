"""add notification prefs to spaces

Revision ID: b7e2c1a90f33
Revises: 8edb758c6885
Create Date: 2026-06-15 14:35:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "b7e2c1a90f33"
down_revision: str | Sequence[str] | None = "8edb758c6885"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Thêm 3 cờ thông báo (mặc định bật) cho spaces."""
    with op.batch_alter_table("spaces", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column("notify_budget", sa.Boolean(), server_default=sa.true(), nullable=False)
        )
        batch_op.add_column(
            sa.Column("notify_member", sa.Boolean(), server_default=sa.true(), nullable=False)
        )
        batch_op.add_column(
            sa.Column("notify_recurring", sa.Boolean(), server_default=sa.true(), nullable=False)
        )


def downgrade() -> None:
    """Gỡ 3 cờ thông báo."""
    with op.batch_alter_table("spaces", schema=None) as batch_op:
        batch_op.drop_column("notify_recurring")
        batch_op.drop_column("notify_member")
        batch_op.drop_column("notify_budget")
