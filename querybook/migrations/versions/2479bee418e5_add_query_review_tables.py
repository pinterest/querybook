"""Add query review tables and update QueryExecutionStatus enum

Revision ID: 2479bee418e5
Revises: aa328ae9dced
Create Date: 2024-12-05 22:40:06.001671

"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "2479bee418e5"
down_revision = "aa328ae9dced"
branch_labels = None
depends_on = None

# Define the old and new QueryExecutionStatus enum types for non-PostgreSQL databases
old_status_enum = sa.Enum(
    "INITIALIZED",
    "DELIVERED",
    "RUNNING",
    "DONE",
    "ERROR",
    "CANCEL",
    name="queryexecutionstatus",
)

new_status_enum = sa.Enum(
    "INITIALIZED",
    "DELIVERED",
    "RUNNING",
    "DONE",
    "ERROR",
    "CANCEL",
    "PENDING_REVIEW",
    "REJECTED",
    name="queryexecutionstatus",
)


def upgrade():
    # ### Enum Modifications ###
    bind = op.get_bind()
    dialect = bind.dialect.name

    if dialect == "postgresql":
        # PostgreSQL: Add new enum values to existing 'queryexecutionstatus' enum
        op.execute("ALTER TYPE queryexecutionstatus ADD VALUE 'PENDING_REVIEW'")
        op.execute("ALTER TYPE queryexecutionstatus ADD VALUE 'REJECTED'")
    else:
        # Other Databases (e.g., MySQL, SQLite): Alter 'query_execution.status' column to use the new enum
        op.alter_column(
            "query_execution",
            "status",
            existing_type=old_status_enum,
            type_=new_status_enum,
            existing_nullable=True,
            postgresql_using=None,
        )

    # ### Table Creation ###
    op.create_table(
        "query_review",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("query_execution_id", sa.Integer(), nullable=False),
        sa.Column("query_author_id", sa.Integer(), nullable=False),
        sa.Column(
            "status",
            sa.Enum("PENDING", "APPROVED", "REJECTED", name="queryreviewstatus"),
            nullable=False,
        ),
        sa.Column("review_request_reason", sa.String(length=5000), nullable=True),
        sa.Column("rejection_reason", sa.String(length=5000), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["query_author_id"], ["user.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["query_execution_id"], ["query_execution.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("query_execution_id"),
        mysql_charset="utf8mb4",
        mysql_engine="InnoDB",
    )

    op.create_table(
        "query_execution_reviewer",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("query_review_id", sa.Integer(), nullable=False),
        sa.Column("uid", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["query_review_id"], ["query_review.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["uid"], ["user.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "query_review_id", "uid", name="unique_query_execution_reviewer"
        ),
        mysql_charset="utf8mb4",
        mysql_engine="InnoDB",
    )
    # ### End Alembic commands ###


def downgrade():
    # ### Table Dropping ###
    op.drop_table("query_execution_reviewer")
    op.drop_table("query_review")

    # ### Enum Modifications ###
    bind = op.get_bind()
    dialect = bind.dialect.name

    if dialect == "postgresql":
        # PostgreSQL: does not support removing enum values directly
        op.execute("ALTER TYPE queryexecutionstatus RENAME TO queryexecutionstatus_old")
        old_status_enum.create(bind, checkfirst=True)
        op.execute(
            "ALTER TABLE query_execution ALTER COLUMN status TYPE queryexecutionstatus USING status::text::queryexecutionstatus"
        )
        op.execute("DROP TYPE queryexecutionstatus_old")
    else:
        # Other Databases (e.g., MySQL, SQLite): Revert 'query_execution.status' column to the old enum
        op.alter_column(
            "query_execution",
            "status",
            existing_type=new_status_enum,
            type_=old_status_enum,
            existing_nullable=True,
            postgresql_using=None,
        )
    # ### End Alembic commands ###
