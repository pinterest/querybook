import sqlalchemy as sql

from app import db
from const.db import now
from const.event_log import EventType
from lib.sqlalchemy import CRUDMixin

Base = db.Base


class EventLog(CRUDMixin, Base):
    __tablename__ = "event_log"
    id = sql.Column(sql.Integer, primary_key=True)
    created_at = sql.Column(sql.DateTime, default=now)
    uid = sql.Column(sql.Integer)
    event_type = sql.Column(sql.Enum(EventType), index=True)
    event_data = sql.Column(sql.JSON, default={})
