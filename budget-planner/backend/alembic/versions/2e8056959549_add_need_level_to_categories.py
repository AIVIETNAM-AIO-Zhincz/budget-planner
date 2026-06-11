"""add need_level to categories

Revision ID: 2e8056959549
Revises: 380e5fac27d4
Create Date: 2026-06-11 10:02:12.361123

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "2e8056959549"
down_revision: str | Sequence[str] | None = "380e5fac27d4"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Thêm cột need_level cho categories (mặc định 'optional' cho dữ liệu cũ)."""
    with op.batch_alter_table("categories", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                "need_level",
                sa.String(length=16),
                server_default="optional",
                nullable=False,
            )
        )


def downgrade() -> None:
    """Gỡ cột need_level."""
    with op.batch_alter_table("categories", schema=None) as batch_op:
        batch_op.drop_column("need_level")
