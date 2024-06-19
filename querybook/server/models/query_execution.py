import sqlalchemy as sql
from sqlalchemy.orm import relationship, backref

from app import db
from lib.utils.serialize import with_formatted_date
from const.db import (
    name_length,
    now,
    description_length,
    url_length,
    mediumtext_length,
    text_length,
)
from const.query_execution import QueryExecutionStatus, StatementExecutionStatus
from lib.sqlalchemy import CRUDMixin


Base = db.Base


class QueryExecution(Base):
    __tablename__ = "query_execution"
    __table_args__ = {"mysql_engine": "InnoDB", "mysql_charset": "utf8mb4"}

    id = sql.Column(sql.Integer, primary_key=True)
    task_id = sql.Column(sql.String(length=name_length))
    status = sql.Column(
        sql.Enum(QueryExecutionStatus), default=QueryExecutionStatus.INITIALIZED
    )

    created_at = sql.Column(sql.DateTime, default=now)
    completed_at = sql.Column(sql.DateTime)

    query = sql.Column(sql.Text(length=mediumtext_length))
    engine_id = sql.Column(
        sql.Integer, sql.ForeignKey("query_engine.id", ondelete="CASCADE")
    )
    uid = sql.Column(sql.Integer, sql.ForeignKey("user.id", ondelete="CASCADE"))

    owner = relationship("User", uselist=False)
    engine = relationship(
        "QueryEngine",
        uselist=False,
        backref=backref("executions", cascade="all, delete", passive_deletes=True),
    )
    statement_executions = relationship(
        "StatementExecution",
        backref="query_execution",
        cascade="all, delete",
        passive_deletes=True,
    )
    notifications = relationship(
        "QueryExecutionNotification",
        backref="query_execution",
        cascade="all, delete",
        passive_deletes=True,
    )
    error = relationship(
        "QueryExecutionError",
        uselist=False,
        cascade="all, delete",
        passive_deletes=True,
    )

    @with_formatted_date
    def to_dict(self, with_statement=True):
        item = {
            "id": self.id,
            "task_id": self.task_id,
            "status": self.status.value,
            "created_at": self.created_at,
            "completed_at": self.completed_at,
            "query": self.query,
            "engine_id": self.engine_id,
            "uid": self.uid,
        }

        if with_statement:
            item["statement_executions"] = [
                s.to_dict() for s in self.statement_executions
            ]

        return item


class QueryExecutionError(Base):
    __tablename__ = "query_execution_error"
    __table_args__ = {"mysql_engine": "InnoDB", "mysql_charset": "utf8mb4"}

    id = sql.Column(sql.Integer, primary_key=True)
    query_execution_id = sql.Column(
        sql.Integer, sql.ForeignKey("query_execution.id", ondelete="CASCADE")
    )
    error_type = sql.Column(sql.Integer, nullable=False, default=0)
    error_message_extracted = sql.Column(sql.String(length=description_length))
    error_message = sql.Column(sql.Text(length=text_length))

    def to_dict(self):
        return {
            "id": self.id,
            "query_execution_id": self.query_execution_id,
            "error_type": self.error_type,
            "error_message_extracted": self.error_message_extracted,
            "error_message": self.error_message,
        }


class StatementExecution(Base):
    __tablename__ = "statement_execution"

    id = sql.Column(sql.Integer, primary_key=True)

    statement_range_start = sql.Column(sql.Integer, nullable=False, default=0)
    statement_range_end = sql.Column(sql.Integer, nullable=False, default=0)

    query_execution_id = sql.Column(
        sql.Integer, sql.ForeignKey("query_execution.id", ondelete="CASCADE")
    )
    status = sql.Column(
        sql.Enum(StatementExecutionStatus), default=StatementExecutionStatus.INITIALIZED
    )
    meta_info = sql.Column(sql.String(length=description_length))

    created_at = sql.Column(sql.DateTime, default=now)
    completed_at = sql.Column(sql.DateTime)

    result_row_count = sql.Column(sql.BigInteger, nullable=False, default=0)
    result_path = sql.Column(sql.String(length=url_length))

    has_log = sql.Column(sql.Boolean, nullable=False, default=False)
    log_path = sql.Column(sql.String(length=url_length))

    @with_formatted_date
    def to_dict(self):
        item = {
            "id": self.id,
            "statement_range_start": self.statement_range_start,
            "statement_range_end": self.statement_range_end,
            "query_execution_id": self.query_execution_id,
            "status": self.status.value,
            "meta_info": self.meta_info,
            "created_at": self.created_at,
            "completed_at": self.completed_at,
            "result_row_count": self.result_row_count,
            "result_path": self.result_path,
            "has_log": self.has_log,
            "log_path": self.log_path,
        }

        return item


class StatementExecutionStreamLog(Base):
    __tablename__ = "statement_execution_stream_log"

    id = sql.Column(sql.BigInteger, primary_key=True)
    statement_execution_id = sql.Column(
        sql.Integer, sql.ForeignKey("statement_execution.id", ondelete="CASCADE")
    )
    created_at = sql.Column(sql.DateTime, default=now)
    log = sql.Column(sql.String(length=description_length))

    def to_dict(self):
        return {
            "id": self.id,
            "statement_execution_id": self.statement_execution_id,
            "log": self.log,
            "created_at": self.created_at,
        }


class QueryExecutionNotification(Base):
    __tablename__ = "query_execution_notification"

    id = sql.Column(sql.Integer, primary_key=True)
    query_execution_id = sql.Column(
        sql.Integer, sql.ForeignKey("query_execution.id", ondelete="CASCADE")
    )
    user = sql.Column(
        sql.Integer, sql.ForeignKey("user.id", ondelete="CASCADE"), nullable=False
    )

    def to_dict(self):
        return {
            "id": self.id,
            "query_execution_id": self.query_execution_id,
            "user": self.user,
        }


class QueryExecutionMetadata(CRUDMixin, Base):
    """
    Represents metadata for a query execution.

    Attributes:
        id: primary key
        query_execution_id: foreign key of the related query execution.
        execution_metadata: A JSON object containing metadata about the query execution.
            - 'sample_rate': The rate at which the table was sampled for this query execution.
    """

    __tablename__ = "query_execution_metadata"

    id = sql.Column(sql.Integer, primary_key=True)
    query_execution_id = sql.Column(
        sql.Integer, sql.ForeignKey("query_execution.id", ondelete="CASCADE")
    )
    execution_metadata = sql.Column(sql.JSON)

    query_execution = relationship(
        "QueryExecution",
        uselist=False,
        backref=backref("metadata", cascade="all, delete", passive_deletes=True),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "query_execution_id": self.query_execution_id,
            "metadata": self.execution_metadata,
        }


class QueryExecutionViewer(CRUDMixin, Base):
    __tablename__ = "query_execution_viewer"
    __table_args__ = (
        sql.UniqueConstraint(
            "query_execution_id", "uid", name="unique_query_execution_viewer"
        ),
    )

    id = sql.Column(sql.Integer, primary_key=True, autoincrement=True)
    query_execution_id = sql.Column(
        sql.Integer, sql.ForeignKey("query_execution.id", ondelete="CASCADE")
    )
    uid = sql.Column(
        sql.Integer, sql.ForeignKey("user.id", ondelete="CASCADE"), nullable=False
    )
    user = relationship("User", foreign_keys="QueryExecutionViewer.uid")

    created_by = sql.Column(
        sql.Integer, sql.ForeignKey("user.id", ondelete="CASCADE"), nullable=False
    )
    creator = relationship("User", foreign_keys="QueryExecutionViewer.created_by")
    created_at = sql.Column(sql.DateTime, default=now, nullable=False)
    query_execution = relationship(
        "QueryExecution",
        uselist=False,
        backref=backref("viewers", cascade="all, delete", passive_deletes=True),
    )
