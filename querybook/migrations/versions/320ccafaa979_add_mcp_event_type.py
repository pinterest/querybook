"""add MCP event type

Revision ID: 320ccafaa979
Revises: a1b2c3d4e5f6
Create Date: 2026-03-04 14:00:00.000000

"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '320ccafaa979'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


# Define the old and new EventType enum types
old_event_type_enum = sa.Enum("API", "WEBSOCKET", "VIEW", "CLICK", name="eventtype")
new_event_type_enum = sa.Enum("API", "WEBSOCKET", "VIEW", "CLICK", "MCP", name="eventtype")


def upgrade():
    """Add MCP to EventType enum"""
    conn = op.get_bind()
    dialect = conn.dialect.name

    if dialect == "postgresql":
        # PostgreSQL: Add new enum value to existing 'eventtype' enum
        op.execute("ALTER TYPE eventtype ADD VALUE 'MCP'")
    else:
        # Other Databases (e.g., MySQL, SQLite): Alter 'event_log.event_type' column to use the new enum
        op.alter_column(
            "event_log",
            "event_type",
            existing_type=old_event_type_enum,
            type_=new_event_type_enum,
        )


def downgrade():
    """Remove MCP from EventType enum"""
    bind = op.get_bind()
    dialect = bind.dialect.name

    if dialect == "postgresql":
        # PostgreSQL: does not support removing enum values directly
        # We need to create a new enum without 'MCP', rename the old one, and update the column
        op.execute("ALTER TYPE eventtype RENAME TO eventtype_old")
        old_event_type_enum.create(bind, checkfirst=True)
        op.execute(
            "ALTER TABLE event_log ALTER COLUMN event_type TYPE eventtype USING event_type::text::eventtype"
        )
        op.execute("DROP TYPE eventtype_old")
    else:
        # Other Databases (e.g., MySQL, SQLite): Revert 'event_log.event_type' column to the old enum
        op.alter_column(
            "event_log",
            "event_type",
            existing_type=new_event_type_enum,
            type_=old_event_type_enum,
        )
