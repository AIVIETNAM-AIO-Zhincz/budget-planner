"""add fund_type to goals

Revision ID: c1946410be53
Revises: 235fc17ed2c7
Create Date: 2026-06-11 14:07:54.042936

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "c1946410be53"
down_revision: str | Sequence[str] | None = "235fc17ed2c7"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Thêm cột fund_type cho goals (mặc định 'general' cho dữ liệu cũ)."""
    with op.batch_alter_table("goals", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                "fund_type",
                sa.String(length=16),
                server_default="general",
                nullable=False,
            )
        )


def downgrade() -> None:
    """Gỡ cột fund_type."""
    with op.batch_alter_table("goals", schema=None) as batch_op:
        batch_op.drop_column("fund_type")
