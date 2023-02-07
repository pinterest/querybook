import sqlalchemy as sql
from sqlalchemy.orm import relationship
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy.ext.hybrid import hybrid_property

from app import db
from const.db import (
    name_length,
    now,
    description_length,
    url_length,
    password_length,
    # mediumtext_length,
    # text_length
)
from const.user_roles import UserRoleType
from lib.sqlalchemy import CRUDMixin


Base = db.Base


class User(CRUDMixin, Base):
    __tablename__ = "user"

    id = sql.Column(sql.Integer, primary_key=True)
    username = sql.Column(sql.String(length=name_length), unique=True)
    fullname = sql.Column(sql.String(length=name_length))
    _password = sql.Column("password", sql.String(length=password_length))

    email = sql.Column(sql.String(length=name_length))
    profile_img = sql.Column(sql.String(length=url_length))
    deleted = sql.Column(sql.Boolean, default=False)
    is_group = sql.Column(sql.Boolean, default=False)

    properties = sql.Column(sql.JSON, default={})

    settings = relationship("UserSetting", cascade="all, delete", passive_deletes=True)
    roles = relationship("UserRole", cascade="all, delete", passive_deletes=True)
    group_members = relationship(
        "User",
        secondary="user_group_member",
        primaryjoin="User.id == UserGroupMember.gid",
        secondaryjoin="User.id == UserGroupMember.uid",
        backref="user_groups",
    )

    @hybrid_property
    def password(self):
        return self._password

    @password.setter
    def password(self, plaintext):
        if plaintext is not None:
            self._password = generate_password_hash(plaintext)
        else:
            self._password = None

    def check_password(self, plaintext):
        return check_password_hash(self._password or "", plaintext)

    def get_name(self):
        return (
            " ".join([name.capitalize() for name in self.fullname.split(" ")])
            if self.fullname
            else self.username
        )

    def to_dict(self, with_roles=False):
        user_dict = {
            "id": self.id,
            "username": self.username,
            "fullname": self.fullname,
            "profile_img": self.profile_img,
            "email": self.email,
            "deleted": self.deleted,
            "is_group": self.is_group,
            "properties": self.properties.get("public_info", {}),
        }

        if with_roles:
            user_dict["roles"] = [role.role.value for role in self.roles]

        return user_dict


class UserSetting(Base):
    __tablename__ = "user_setting"
    __table_args__ = {"mysql_engine": "InnoDB", "mysql_charset": "utf8mb4"}

    id = sql.Column(sql.Integer, primary_key=True)
    uid = sql.Column(sql.Integer, sql.ForeignKey("user.id", ondelete="CASCADE"))
    key = sql.Column(sql.String(length=name_length))
    value = sql.Column(sql.String(length=description_length))
    created_at = sql.Column(sql.DateTime, default=now)

    def to_dict(self):
        return {
            # 'username': self.username,
            "key": self.key,
            "value": self.value,
        }


class UserRole(db.Base):
    __tablename__ = "user_role"

    id = sql.Column(sql.Integer, primary_key=True)
    uid = sql.Column(sql.Integer, sql.ForeignKey("user.id", ondelete="CASCADE"))
    role = sql.Column(sql.Enum(UserRoleType), nullable=False)
    created_at = sql.Column(sql.DateTime, default=now)

    def to_dict(self):
        return {
            "id": self.id,
            "uid": self.uid,
            "role": self.role.value,
            "created_at": self.created_at,
        }


class UserGroupMember(Base):
    __tablename__ = "user_group_member"

    id = sql.Column(sql.Integer, primary_key=True)
    gid = sql.Column(sql.Integer, sql.ForeignKey("user.id", ondelete="CASCADE"))
    uid = sql.Column(sql.Integer, sql.ForeignKey("user.id", ondelete="CASCADE"))
    created_at = sql.Column(sql.DateTime, default=now)
