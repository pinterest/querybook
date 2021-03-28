"""update board and board item descriptions

Revision ID: 1e3eb54fcb83
Revises: b8a9e3e18bcc
Create Date: 2021-03-23 21:00:35.909596

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "1e3eb54fcb83"
down_revision = "b8a9e3e18bcc"
branch_labels = None
depends_on = None


def upgrade():
    MediumText = sa.Text(length=16777215)
    conn = op.get_bind()
    if conn.dialect.name == "postgresql":
        MediumText = sa.Text()

    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column("board_item", sa.Column("description", MediumText, nullable=True))
    op.alter_column(
        "board",
        "description",
        existing_type=sa.String(length=5000),
        type_=MediumText,
        existing_nullable=True,
    )
    # ### end Alembic commands ###


def downgrade():
    MediumText = sa.Text(length=16777215)
    conn = op.get_bind()
    if conn.dialect.name == "postgresql":
        MediumText = sa.Text()

    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column(
        "board",
        "description",
        existing_type=MediumText,
        type_=sa.String(length=5000),
        existing_nullable=True,
    )
    op.drop_column("board_item", "description")
    # ### end Alembic commands ###
