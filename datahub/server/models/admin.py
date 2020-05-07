import markdown2
import sqlalchemy as sql
from sqlalchemy.orm import relationship, backref


from app import db
from const.admin import AdminOperation
from const.db import (
    name_length,
    now,
    description_length,
    # mediumtext_length,
    # text_length
)
from lib.sqlalchemy import CRUDMixin

Base = db.Base


class Announcement(CRUDMixin, Base):
    __tablename__ = "announcements"
    __table_args__ = {"mysql_engine": "InnoDB", "mysql_charset": "utf8mb4"}

    id = sql.Column(sql.Integer, primary_key=True)
    created_at = sql.Column(sql.DateTime, default=now)
    updated_at = sql.Column(sql.DateTime, default=now)
    uid = sql.Column(sql.Integer, sql.ForeignKey("user.id", ondelete="CASCADE"))
    message = sql.Column(sql.String(length=description_length))
    url_regex = sql.Column(sql.String(length=name_length))
    can_dismiss = sql.Column(sql.Boolean, default=True)

    def to_dict(self):
        return {
            "id": self.id,
            "message": markdown2.markdown(self.message),
            "url_regex": self.url_regex,
            "can_dismiss": self.can_dismiss,
        }

    def to_dict_admin(self):
        return {
            "id": self.id,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "message": self.message,
            "uid": self.uid,
            "url_regex": self.url_regex,
            "can_dismiss": self.can_dismiss,
        }


class QueryEngine(CRUDMixin, Base):
    __tablename__ = "query_engine"

    id = sql.Column(sql.Integer, primary_key=True)
    created_at = sql.Column(sql.DateTime, default=now)
    updated_at = sql.Column(sql.DateTime, default=now)
    deleted_at = sql.Column(sql.DateTime)

    name = sql.Column(sql.String(length=name_length), unique=True, nullable=False)
    description = sql.Column(sql.String(length=name_length))

    language = sql.Column(sql.String(length=name_length), nullable=False)
    executor = sql.Column(sql.String(length=name_length), nullable=False)
    status_checker = sql.Column(sql.String(length=name_length))

    # JSON field
    executor_params = sql.Column(sql.JSON)
    control_params = sql.Column(sql.JSON, default={}, nullable=False)

    metastore_id = sql.Column(sql.Integer, sql.ForeignKey("query_metastore.id"))
    metastore = relationship("QueryMetastore", backref="query_engine")

    environment_id = sql.Column(
        sql.Integer,
        sql.ForeignKey("environment.id", ondelete="CASCADE"),
        nullable=False,
    )
    environment = relationship(
        "Environment", uselist=False, backref=backref("query_engines"),
    )

    def to_dict(self):
        # IMPORTANT: do not expose executor params unless it is for admin
        return {
            "id": self.id,
            "name": self.name,
            "language": self.language,
            "description": self.description,
            "metastore_id": self.metastore_id,
            "environment_id": self.environment_id,
            "executor": self.executor,
        }

    def to_dict_admin(self):
        # THIS API IS FOR ADMIN USAGE
        return {
            "id": self.id,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "deleted_at": self.deleted_at,
            "name": self.name,
            "language": self.language,
            "description": self.description,
            "metastore_id": self.metastore_id,
            "environment_id": self.environment_id,
            "executor": self.executor,
            "executor_params": self.get_engine_params(),
            "control_params": self.control_params,
            "status_checker": self.status_checker,
            "environment": self.environment,
        }

    def get_engine_params(self):
        return self.executor_params


class QueryMetastore(CRUDMixin, Base):
    __tablename__ = "query_metastore"

    id = sql.Column(sql.Integer, primary_key=True)
    created_at = sql.Column(sql.DateTime, default=now)
    updated_at = sql.Column(sql.DateTime, default=now)
    deleted_at = sql.Column(sql.DateTime)

    name = sql.Column(sql.String(length=name_length), unique=True, nullable=False)
    # Comma separated hive metastore urls
    loader = sql.Column(sql.String(length=128), nullable=False)
    metastore_params = sql.Column(sql.JSON)

    acl_control = sql.Column(sql.JSON, default={}, nullable=False)

    # TODO: support multiple types of metastore
    def to_dict(self):
        return {"id": self.id, "name": self.name}

    def to_dict_admin(self):
        return {
            "id": self.id,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "deleted_at": self.deleted_at,
            "name": self.name,
            "loader": self.loader,
            "metastore_params": self.metastore_params,
            "acl_control": self.acl_control,
        }


class APIAccessToken(CRUDMixin, Base):
    __tablename__ = "api_access_token"

    id = sql.Column(sql.Integer, primary_key=True)
    token = sql.Column(sql.String(length=128), unique=True, nullable=False)
    description = sql.Column(sql.String(length=description_length))
    enabled = sql.Column(sql.Boolean, default=True)
    created_at = sql.Column(sql.DateTime, default=now)
    creator_uid = sql.Column(sql.Integer, sql.ForeignKey("user.id", ondelete="CASCADE"))
    updated_at = sql.Column(sql.DateTime, default=now)
    updater_uid = sql.Column(sql.Integer, sql.ForeignKey("user.id", ondelete="CASCADE"))

    def to_dict(self):
        return {
            "id": self.id,
            "description": self.description,
            "enabled": self.enabled,
            "created_at": self.created_at,
            "creator_uid": self.creator_uid,
            "updated_at": self.updated_at,
            "updater_uid": self.updater_uid,
        }


class AdminAuditLog(CRUDMixin, Base):
    __tablename__ = "admin_audit_log"
    id = sql.Column(sql.Integer, primary_key=True)

    created_at = sql.Column(sql.DateTime, default=now, nullable=False)
    uid = sql.Column(sql.Integer, sql.ForeignKey("user.id", ondelete="CASCADE"))

    item_type = sql.Column(sql.String(length=name_length), nullable=False, index=True)
    item_id = sql.Column(sql.Integer, nullable=False, index=True)
    op = sql.Column(sql.Enum(AdminOperation), nullable=False)
    log = sql.Column(sql.String(length=description_length))

    relationship("User", uselist=False)
