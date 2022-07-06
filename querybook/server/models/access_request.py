import sqlalchemy as sql
from app import db
from lib.sqlalchemy import CRUDMixin
from const.db import now

Base = db.Base


class AccessRequest(CRUDMixin, Base):
    __tablename__ = "access_request"
    __table_args__ = (
        sql.UniqueConstraint(
            "data_doc_id", "uid", name="unique_data_doc_access_request"
        ),
        sql.UniqueConstraint(
            "query_execution_id", "uid", name="unique_query_execution_access_request"
        ),
    )
    id = sql.Column(sql.Integer, primary_key=True, autoincrement=True)
    uid = sql.Column(sql.Integer, sql.ForeignKey("user.id", ondelete="CASCADE"))
    data_doc_id = sql.Column(
        sql.Integer, sql.ForeignKey("data_doc.id", ondelete="CASCADE"), nullable=True
    )
    query_execution_id = sql.Column(
        sql.Integer,
        sql.ForeignKey("query_execution.id", ondelete="CASCADE"),
        nullable=True,
    )
    board_id = sql.Column(
        sql.Integer,
        sql.ForeignKey("board.id", ondelete="CASCADE"),
        nullable=True,
    )
    created_at = sql.Column(sql.DateTime, default=now)
