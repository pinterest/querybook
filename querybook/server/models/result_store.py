import sqlalchemy as sql
from app import db
from lib.sqlalchemy import CRUDMixin
from const.db import utf8mb4_name_length, mediumtext_length, now


class KeyValueStore(CRUDMixin, db.Base):
    __tablename__ = "key_value_store"
    __table_args__ = {"mysql_engine": "InnoDB", "mysql_charset": "utf8mb4"}

    id = sql.Column(sql.Integer, primary_key=True)
    key = sql.Column(sql.String(length=utf8mb4_name_length), unique=True, index=True)
    value = sql.Column(sql.Text(length=mediumtext_length))
    created_at = sql.Column(sql.DateTime, default=now)
    updated_at = sql.Column(sql.DateTime, default=now)
