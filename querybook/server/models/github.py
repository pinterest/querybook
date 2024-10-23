import sqlalchemy as sql
from sqlalchemy.sql import func
from lib.sqlalchemy import CRUDMixin
from sqlalchemy.orm import backref, relationship
from app import db

Base = db.Base


class GitHubLink(Base, CRUDMixin):
    __tablename__ = "github_link"
    id = sql.Column(sql.Integer, primary_key=True, autoincrement=True)
    datadoc_id = sql.Column(
        sql.Integer, sql.ForeignKey("data_doc.id"), nullable=False, unique=True
    )
    user_id = sql.Column(sql.Integer, sql.ForeignKey("user.id"), nullable=False)
    directory = sql.Column(sql.String(255), nullable=False)
    created_at = sql.Column(sql.DateTime, server_default=func.now(), nullable=False)
    updated_at = sql.Column(
        sql.DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    datadoc = relationship(
        "DataDoc",
        backref=backref("github_link", uselist=False, cascade="all, delete-orphan"),
    )
    user = relationship("User", backref=backref("github_link", uselist=False))

    def to_dict(self):
        return {
            "id": self.id,
            "datadoc_id": self.datadoc_id,
            "user_id": self.user_id,
            "directory": self.directory,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }
