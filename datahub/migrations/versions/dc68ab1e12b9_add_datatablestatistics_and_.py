"""Add DataTableStatistics and DataTableColumnStatistics

Revision ID: dc68ab1e12b9
Revises: 178d6726310a
Create Date: 2020-08-13 18:56:18.127536

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = "dc68ab1e12b9"
down_revision = "178d6726310a"
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table(
        "data_table_statistics",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("table_id", sa.Integer(), nullable=False),
        sa.Column("key", sa.String(length=191), nullable=False),
        sa.Column("value", sa.JSON(), nullable=False),
        sa.Column("uid", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["table_id"], ["data_table.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["uid"], ["user.id"],),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_data_table_statistics_key"),
        "data_table_statistics",
        ["key"],
        unique=False,
    )

    op.create_table(
        "data_table_column_statistics",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("column_id", sa.Integer(), nullable=False),
        sa.Column("key", sa.String(length=191), nullable=False),
        sa.Column("value", sa.JSON(), nullable=False),
        sa.Column("uid", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ["column_id"], ["data_table_column.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["uid"], ["user.id"],),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_data_table_column_statistics_key"),
        "data_table_column_statistics",
        ["key"],
        unique=False,
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index(
        op.f("ix_data_table_column_statistics_key"),
        table_name="data_table_column_statistics",
    )
    op.drop_table("data_table_column_statistics")
    op.drop_index(
        op.f("ix_data_table_statistics_key"), table_name="data_table_statistics"
    )
    op.drop_table("data_table_statistics")
    # ### end Alembic commands ###
