"""Add end_date and occurrence to table_schedule table

Revision ID: 7c5b1fbec85d
Revises: f449a73c5838
Create Date: 2022-08-25 06:47:11.863442

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '7c5b1fbec85d'
down_revision = 'f449a73c5838'
branch_labels = None
depends_on = None




def upgrade():
    op.add_column("task_schedule", sa.Column("end_time", sa.DateTime(), nullable=True))
    op.add_column("task_schedule", sa.Column("occurrences", sa.Integer(), nullable=True))


def downgrade():
    op.drop_column("task_schedule", "end_time")
    op.drop_column("task_schedule", "occurrences")
