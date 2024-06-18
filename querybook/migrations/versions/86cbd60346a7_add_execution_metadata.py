"""add execution metadata

Revision ID: 86cbd60346a7
Revises: 767cf0f573bd
Create Date: 2024-06-14 01:13:27.384358

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "86cbd60346a7"
down_revision = "767cf0f573bd"
branch_labels = None
depends_on = None


def upgrade():
    # create new table
    op.create_table(
        "query_execution_metadata",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column(
            "query_execution_id",
            sa.Integer,
            sa.ForeignKey("query_execution.id", ondelete="CASCADE"),
        ),
        sa.Column("sample_rate", sa.JSON),
    )


def downgrade():
    # drop the table
    op.drop_table("query_execution_metadata")
