"""add boardEditor and board as board item

Revision ID: f449a73c5838
Revises: 17f7c039ab6e
Create Date: 2022-06-15 17:37:05.219498

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = "f449a73c5838"
down_revision = "17f7c039ab6e"
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column("board_item", sa.Column("board_item_id", sa.Integer(), nullable=True))
    op.create_foreign_key(None, "board_item", "board", ["board_item_id"], ["id"])
    op.create_foreign_key(None, "board_item", "board", ["board_id"], ["id"])

    op.create_table(
        "board_editor",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("board_id", sa.Integer(), nullable=False),
        sa.Column("uid", sa.Integer(), nullable=False),
        sa.Column("read", sa.Boolean(), nullable=False),
        sa.Column("write", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(
            ["board_id"],
            ["board.id"],
            name="board_editor_ibfk_1",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["uid"],
            ["user.id"],
            name="board_editor_ibfk_2",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("board_id", "uid", name="unique_board_user"),
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table("board_editor")

    op.drop_constraint(None, "board_item", type_="foreignkey")
    op.drop_constraint(None, "board_item", type_="foreignkey")
    op.drop_column("board_item", "board_item_id")
    # ### end Alembic commands ###
