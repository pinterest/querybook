"""Extend DataTableColumn type length

Revision ID: 27ed76f75106
Revises: 63bde0162416
Create Date: 2023-01-05 09:43:06.639449

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = "27ed76f75106"
down_revision = "63bde0162416"
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column(
        "data_table_column",
        "type",
        nullable=True,
        existing_type=sa.String(length=255),
        type_=sa.String(length=4096),
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column(
        "data_table_column",
        "type",
        nullable=True,
        existing_type=sa.String(length=4096),
        type_=sa.String(length=255),
    )
    # ### end Alembic commands ###