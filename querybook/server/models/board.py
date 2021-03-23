import sqlalchemy as sql
from sqlalchemy.orm import relationship, backref

from app import db
from const.db import name_length, now, mediumtext_length
from lib.sqlalchemy import CRUDMixin

Base = db.Base


class Board(CRUDMixin, Base):
    __tablename__ = "board"
    __table_args__ = {"mysql_engine": "InnoDB", "mysql_charset": "utf8mb4"}

    id = sql.Column(sql.Integer, primary_key=True)
    created_at = sql.Column(sql.DateTime, default=now)
    updated_at = sql.Column(sql.DateTime, default=now)
    deleted_at = sql.Column(sql.DateTime)

    name = sql.Column(sql.String(length=name_length), nullable=False)
    description = sql.Column(sql.Text(length=mediumtext_length))
    public = sql.Column(sql.Boolean, default=True)
    board_type = sql.Column(sql.String(length=name_length), default="")

    environment_id = sql.Column(
        sql.Integer,
        sql.ForeignKey("environment.id", ondelete="CASCADE"),
        nullable=False,
    )
    owner_uid = sql.Column(sql.Integer, sql.ForeignKey("user.id", ondelete="CASCADE"))

    owner = relationship("User", uselist=False)

    docs = relationship(
        "DataDoc",
        secondary="board_item",
        backref=backref("boards"),
        order_by="desc(BoardItem.item_order)",
    )
    tables = relationship(
        "DataTable",
        secondary="board_item",
        backref=backref("boards"),
        order_by="desc(BoardItem.item_order)",
    )

    @db.with_session
    def get_max_item_order(self, session=None):
        return (
            next(
                iter(
                    session.query(sql.func.max(BoardItem.item_order))
                    .filter_by(board_id=self.id)
                    .first()
                ),
                None,
            )
            or 0
        )

    @classmethod
    @db.with_session
    def get_by_uid(cls, owner_uid, environment_id, session=None):
        return (
            session.query(Board)
            .filter_by(owner_uid=owner_uid, environment_id=environment_id)
            .all()
        )


class BoardItem(CRUDMixin, Base):
    __tablename__ = "board_item"

    id = sql.Column(sql.Integer, primary_key=True, autoincrement=True)
    data_doc_id = sql.Column(
        sql.Integer, sql.ForeignKey("data_doc.id", ondelete="CASCADE"), nullable=True
    )
    table_id = sql.Column(
        sql.Integer, sql.ForeignKey("data_table.id", ondelete="CASCADE"), nullable=True
    )
    board_id = sql.Column(
        sql.Integer, sql.ForeignKey("board.id", ondelete="CASCADE"), nullable=False
    )
    item_order = sql.Column(sql.Integer)
    created_at = sql.Column(sql.DateTime, default=now)
    description = sql.Column(sql.Text(length=mediumtext_length))

    board = relationship(
        "Board",
        backref=backref("items", order_by="BoardItem.item_order", cascade="all,delete"),
        uselist=False,
    )

    table = relationship("DataTable", uselist=False)

    data_doc = relationship("DataDoc", uselist=False)
