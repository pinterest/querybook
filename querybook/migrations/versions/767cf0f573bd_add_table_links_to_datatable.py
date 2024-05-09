"""add table links to datatable

Revision ID: 767cf0f573bd
Revises: 299e24dcfd29
Create Date: 2024-05-09 18:17:17.799678

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = '767cf0f573bd'
down_revision = '299e24dcfd29'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column('board_editor', 'board_id',
               existing_type=mysql.INTEGER(),
               nullable=True)
    op.alter_column('board_editor', 'uid',
               existing_type=mysql.INTEGER(),
               nullable=True)
    op.drop_constraint('board_item_ibfk_1', 'board_item', type_='foreignkey')
    op.create_foreign_key(None, 'board_item', 'board', ['parent_board_id'], ['id'])
    op.alter_column('data_doc_dag_export', 'created_at',
               existing_type=mysql.DATETIME(),
               nullable=False)
    op.alter_column('data_doc_dag_export', 'updated_at',
               existing_type=mysql.DATETIME(),
               nullable=False)
    op.add_column('data_table_information', sa.Column('table_links', sa.JSON(), nullable=True))
    op.alter_column('environment', 'shareable',
               existing_type=mysql.TINYINT(display_width=1),
               nullable=False,
               existing_server_default=sa.text("'1'"))
    op.drop_constraint('event_log_ibfk_1', 'event_log', type_='foreignkey')
    op.alter_column('user_group_member', 'gid',
               existing_type=mysql.INTEGER(),
               nullable=True)
    op.alter_column('user_group_member', 'uid',
               existing_type=mysql.INTEGER(),
               nullable=True)
    op.alter_column('user_group_member', 'created_at',
               existing_type=mysql.DATETIME(),
               nullable=True)
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column('user_group_member', 'created_at',
               existing_type=mysql.DATETIME(),
               nullable=False)
    op.alter_column('user_group_member', 'uid',
               existing_type=mysql.INTEGER(),
               nullable=False)
    op.alter_column('user_group_member', 'gid',
               existing_type=mysql.INTEGER(),
               nullable=False)
    op.create_foreign_key('event_log_ibfk_1', 'event_log', 'user', ['uid'], ['id'])
    op.alter_column('environment', 'shareable',
               existing_type=mysql.TINYINT(display_width=1),
               nullable=True,
               existing_server_default=sa.text("'1'"))
    op.drop_column('data_table_information', 'table_links')
    op.alter_column('data_doc_dag_export', 'updated_at',
               existing_type=mysql.DATETIME(),
               nullable=True)
    op.alter_column('data_doc_dag_export', 'created_at',
               existing_type=mysql.DATETIME(),
               nullable=True)
    op.drop_constraint(None, 'board_item', type_='foreignkey')
    op.create_foreign_key('board_item_ibfk_1', 'board_item', 'board', ['parent_board_id'], ['id'], ondelete='CASCADE')
    op.alter_column('board_editor', 'uid',
               existing_type=mysql.INTEGER(),
               nullable=False)
    op.alter_column('board_editor', 'board_id',
               existing_type=mysql.INTEGER(),
               nullable=False)
    # ### end Alembic commands ###
