"""add index uid created_at

Revision ID: a1b2c3d4e5f6
Revises: e7a17a8acf4c
Create Date: 2026-02-03 22:49:33.663672

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "a1b2c3d4e5f6"
down_revision = "e7a17a8acf4c"
branch_labels = None
depends_on = None


def upgrade():
    try:
        op.create_index(
            "idx_uid_created_at", "query_execution", ["uid", "created_at"], unique=False
        )
    except Exception as e:
        print(f"Failed to create index idx_uid_created_at. Error: {e}")


def downgrade():
    op.drop_index("idx_uid_created_at", table_name="query_execution")
