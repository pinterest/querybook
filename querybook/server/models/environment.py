import sqlalchemy as sql
from sqlalchemy.orm import relationship, backref

from app.db import with_session, Base
from const.db import (
    name_length,
    description_length,
    url_length,
    now,
    # mediumtext_length,
    # text_length
)
from lib.sqlalchemy import CRUDMixin


class Environment(CRUDMixin, Base):
    __tablename__ = "environment"

    id = sql.Column(sql.Integer, primary_key=True)
    name = sql.Column(
        sql.String(length=name_length), unique=True, index=True, nullable=False
    )
    description = sql.Column(sql.String(length=description_length))
    image = sql.Column(sql.String(length=url_length))

    # Public means any users who can log on to querybook can access
    # Private requires users to be manually added
    public = sql.Column(sql.Boolean, default=False)

    # Hidden = True means users won't see this environment if they
    # cannot access it. Hidden = False then users can see the env
    # regardless of their access
    hidden = sql.Column(sql.Boolean, default=False)

    # shareable = True means user's queries and data docs are public
    # by default so anyone in the environment can see it
    # If shareable = False then queries & data docs are private and
    # can only be viewed if users have access
    shareable = sql.Column(sql.Boolean, default=True, nullable=False)

    deleted_at = sql.Column(sql.DateTime)

    users = relationship(
        "User",
        secondary="user_environment",
        backref=backref("environments"),
    )

    @with_session
    def can_uid_access(self, uid: int, session=None):
        if self.public:
            return True

        user_environment = (
            session.query(UserEnvironment)
            .filter_by(environment_id=self.id, user_id=uid)
            .first()
        )

        return user_environment is not None


class UserEnvironment(CRUDMixin, Base):
    __tablename__ = "user_environment"

    id = sql.Column(sql.Integer, primary_key=True, autoincrement=True)
    environment_id = sql.Column(
        sql.Integer,
        sql.ForeignKey("environment.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id = sql.Column(
        sql.Integer, sql.ForeignKey("user.id", ondelete="CASCADE"), nullable=False
    )
    created_at = sql.Column(sql.DateTime, default=now)
