"""Add query engine to user mapping

Revision ID: 2f40b8318af4
Revises: f449a73c5838
Create Date: 2022-08-08 14:41:08.327341

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = "2f40b8318af4"
down_revision = "f449a73c5838"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "user_query_engine",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("query_engine_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(
            ["query_engine_id"], ["query_engine.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade():
    op.drop_table("user_query_engine")
