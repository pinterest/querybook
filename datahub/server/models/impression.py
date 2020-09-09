import sqlalchemy as sql

from app import db

from const.db import now
from const.impression import ImpressionItemType

Base = db.Base


class Impression(Base):
    __tablename__ = "impression"
    id = sql.Column(sql.Integer, primary_key=True)
    item_id = sql.Column(sql.Integer, index=True)
    item_type = sql.Column(sql.Enum(ImpressionItemType), index=True)
    uid = sql.Column(sql.Integer, sql.ForeignKey("user.id", ondelete="CASCADE"))
    created_at = sql.Column(sql.DateTime, default=now)

    def to_dict(self):
        return {
            "id": self.id,
            "item_id": self.item_id,
            "item_type": self.item_type.name,
            "uid": self.uid,
            "created_at": self.created_at,
        }
