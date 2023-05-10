import sqlalchemy as sql
from app import db
from lib.sqlalchemy import CRUDMixin
from sqlalchemy.orm import relationship
from const.db import mediumtext_length, name_length, now

Base = db.Base


class Comment(CRUDMixin, Base):
    __tablename__ = "comment"

    id = sql.Column(sql.Integer, primary_key=True)

    created_at = sql.Column(sql.DateTime, default=now)
    updated_at = sql.Column(sql.DateTime, default=now)
    created_by = sql.Column(
        sql.Integer, sql.ForeignKey("user.id", ondelete="SET NULL"), nullable=True
    )

    text = sql.Column(sql.Text(length=mediumtext_length))

    has_thread = sql.Column(sql.Boolean, default=False)


class CommentReaction(CRUDMixin, Base):
    __tablename__ = "comment_reaction"

    id = sql.Column(sql.Integer, primary_key=True, autoincrement=True)
    comment_id = sql.Column(
        sql.Integer,
        sql.ForeignKey("comment.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
        unique=True,
    )
    reaction = sql.Column(
        sql.String(length=name_length), index=True, unique=True, nullable=False
    )
    created_by = sql.Column(
        sql.Integer, sql.ForeignKey("user.id", ondelete="SET NULL"), nullable=True
    )


class DataTableComment(CRUDMixin, Base):
    __tablename__ = "data_table_comment"

    id = sql.Column(sql.Integer, primary_key=True, autoincrement=True)
    data_table_id = sql.Column(
        sql.Integer,
        sql.ForeignKey("data_table.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
        unique=True,
    )
    comment_id = sql.Column(
        sql.Integer,
        sql.ForeignKey("comment.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )

    data_table = relationship("DataTable", uselist=False)
    comment = relationship("Comment", uselist=False)


class DataCellComment(CRUDMixin, Base):
    __tablename__ = "data_cell_comment"

    id = sql.Column(sql.Integer, primary_key=True, autoincrement=True)
    data_cell_id = sql.Column(
        sql.Integer,
        sql.ForeignKey("data_cell.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
        unique=True,
    )
    comment_id = sql.Column(
        sql.Integer,
        sql.ForeignKey("comment.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )

    data_cell = relationship("DataCell", uselist=False)
    comment = relationship("Comment", uselist=False)


class NestedComment(CRUDMixin, Base):
    __tablename__ = "nested_comment"
    id = sql.Column(sql.Integer, primary_key=True, autoincrement=True)
    parent_comment_id = sql.Column(
        sql.Integer,
        sql.ForeignKey("comment.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
        unique=True,
    )
    child_comment_id = sql.Column(
        sql.Integer,
        sql.ForeignKey("comment.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )

    child_comment = relationship(
        "Comment", foreign_keys="NestedComment.child_comment_id", uselist=False
    )
