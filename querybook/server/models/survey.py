import sqlalchemy as sql

from app import db
from const.db import (
    description_length,
    name_length,
    now,
)
from lib.sqlalchemy import CRUDMixin

Base = db.Base


class Survey(CRUDMixin, Base):
    __tablename__ = "survey"

    id = sql.Column(sql.Integer, primary_key=True)
    created_at = sql.Column(sql.DateTime, default=now)
    updated_at = sql.Column(sql.DateTime, default=now)

    uid = sql.Column(sql.Integer, sql.ForeignKey("user.id", ondelete="CASCADE"))

    rating = sql.Column(sql.Integer, nullable=False)
    comment = sql.Column(sql.String(length=description_length), nullable=True)

    surface = sql.Column(sql.String(length=name_length), nullable=False)
    surface_metadata = sql.Column(sql.JSON, default={}, nullable=False)
