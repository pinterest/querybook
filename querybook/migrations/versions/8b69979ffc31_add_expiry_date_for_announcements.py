"""add expiry date for announcements

Revision ID: 8b69979ffc31
Revises: aceefd7708b6
Create Date: 2021-10-22 09:04:47.064570

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '8b69979ffc31'
down_revision = 'aceefd7708b6'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('announcements', sa.Column('active_from', sa.Date(), nullable=True))
    op.add_column('announcements', sa.Column('active_till', sa.Date(), nullable=True))


def downgrade():
    op.drop_column('announcements', 'active_from')
    op.drop_column('announcements', 'active_till')
