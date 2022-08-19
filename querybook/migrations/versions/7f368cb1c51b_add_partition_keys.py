"""add partition keys

Revision ID: 7f368cb1c51b
Revises: f449a73c5838
Create Date: 2022-08-19 17:13:50.930313

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = '7f368cb1c51b'
down_revision = 'f449a73c5838'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('data_table_information', sa.Column('partition_keys', sa.Text(length=16777215), nullable=True))
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('data_table_information', 'partition_keys')
    # ### end Alembic commands ###
