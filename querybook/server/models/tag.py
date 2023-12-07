import sqlalchemy as sql
from sqlalchemy.orm import relationship, backref

from app import db
from const.db import (
    name_length,
    now,
)
from lib.sqlalchemy import CRUDMixin

Base = db.Base


class Tag(CRUDMixin, Base):
    __tablename__ = "tag"

    id = sql.Column(sql.Integer, primary_key=True)
    created_at = sql.Column(sql.DateTime, default=now)
    updated_at = sql.Column(sql.DateTime, default=now)
    meta = sql.Column(sql.JSON, default={}, nullable=False)

    name = sql.Column(
        sql.String(length=name_length), unique=True, index=True, nullable=False
    )
    count = sql.Column(sql.Integer, default=1, nullable=False)


class TagItem(CRUDMixin, Base):
    __tablename__ = "tag_item"

    id = sql.Column(sql.Integer, primary_key=True)
    created_at = sql.Column(sql.DateTime, default=now)

    tag_name = sql.Column(
        sql.String(length=name_length),
        sql.ForeignKey("tag.name", ondelete="CASCADE"),
        nullable=False,
    )

    table_id = sql.Column(
        sql.Integer, sql.ForeignKey("data_table.id", ondelete="CASCADE"), nullable=True
    )
    column_id = sql.Column(
        sql.Integer,
        sql.ForeignKey("data_table_column.id", ondelete="CASCADE"),
        nullable=True,
    )

    uid = sql.Column(
        sql.Integer, sql.ForeignKey("user.id", ondelete="SET NULL"), nullable=True
    )

    tag = relationship(
        "Tag",
        backref=backref("tag_item", cascade="all, delete", passive_deletes=True),
        foreign_keys=[tag_name],
    )
    table = relationship(
        "DataTable",
        backref=backref("tags", cascade="all, delete", passive_deletes=True),
        foreign_keys=[table_id],
    )
    column = relationship(
        "DataTableColumn",
        backref=backref("tags", cascade="all, delete", passive_deletes=True),
        foreign_keys=[column_id],
    )
