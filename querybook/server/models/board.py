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
        primaryjoin="Board.id == BoardItem.parent_board_id",
        secondaryjoin="DataDoc.id == BoardItem.data_doc_id",
        viewonly=True,
    )
    tables = relationship(
        "DataTable",
        secondary="board_item",
        primaryjoin="Board.id == BoardItem.parent_board_id",
        secondaryjoin="DataTable.id == BoardItem.table_id",
        viewonly=True,
    )
    queries = relationship(
        "QueryExecution",
        secondary="board_item",
        primaryjoin="Board.id == BoardItem.parent_board_id",
        secondaryjoin="QueryExecution.id == BoardItem.query_execution_id",
        viewonly=True,
    )

    environment = relationship(
        "Environment",
        uselist=False,
        backref=backref("boards", cascade="all, delete", passive_deletes=True),
    )

    @db.with_session
    def get_max_item_order(self, session=None):
        return (
            next(
                iter(
                    session.query(sql.func.max(BoardItem.item_order))
                    .filter_by(parent_board_id=self.id)
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
    board_id = sql.Column(sql.Integer, sql.ForeignKey("board.id"), nullable=True)
    query_execution_id = sql.Column(
        sql.Integer,
        sql.ForeignKey("query_execution.id", ondelete="CASCADE"),
        nullable=True,
    )

    parent_board_id = sql.Column(
        sql.Integer, sql.ForeignKey("board.id"), nullable=False
    )

    item_order = sql.Column(sql.Integer)
    created_at = sql.Column(sql.DateTime, default=now)
    description = sql.Column(sql.Text(length=mediumtext_length))

    meta = sql.Column(sql.JSON, default={}, nullable=False)

    # the board that board_item belongs to
    parent_board = relationship(
        "Board",
        backref=backref("items", order_by="BoardItem.item_order", cascade="all,delete"),
        uselist=False,
        foreign_keys=parent_board_id,
    )

    board = relationship(
        "Board",
        backref=backref(
            "boards", order_by="BoardItem.item_order", cascade="all,delete"
        ),
        uselist=False,
        foreign_keys=board_id,
    )


class BoardEditor(CRUDMixin, Base):
    __tablename__ = "board_editor"
    __table_args__ = (
        sql.UniqueConstraint("board_id", "uid", name="unique_board_user"),
    )

    id = sql.Column(sql.Integer, primary_key=True, autoincrement=True)
    board_id = sql.Column(sql.Integer, sql.ForeignKey("board.id", ondelete="CASCADE"))
    uid = sql.Column(sql.Integer, sql.ForeignKey("user.id", ondelete="CASCADE"))

    read = sql.Column(sql.Boolean, default=False, nullable=False)
    write = sql.Column(sql.Boolean, default=False, nullable=False)

    user = relationship("User", uselist=False)

    board = relationship(
        "Board",
        uselist=False,
        backref=backref("editors", cascade="all, delete", passive_deletes=True),
    )
