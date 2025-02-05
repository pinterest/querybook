import sqlalchemy as sql
from sqlalchemy.orm import relationship, backref

from app import db
from const.db import now, description_length
from const.query_execution import QueryExecutionStatus
from lib.sqlalchemy import CRUDMixin
from lib.utils.serialize import with_formatted_date

Base = db.Base


class QueryReview(Base, CRUDMixin):
    __tablename__ = "query_review"
    __table_args__ = {"mysql_engine": "InnoDB", "mysql_charset": "utf8mb4"}

    id = sql.Column(sql.Integer, primary_key=True, autoincrement=True)
    query_execution_id = sql.Column(
        sql.Integer,
        sql.ForeignKey("query_execution.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    reviewed_by = sql.Column(
        sql.Integer,
        sql.ForeignKey("user.id", ondelete="SET NULL"),
        nullable=True,
    )
    request_reason = sql.Column(sql.String(length=description_length), nullable=False)
    rejection_reason = sql.Column(sql.String(length=description_length), nullable=True)
    created_at = sql.Column(sql.DateTime, default=now, nullable=False)
    updated_at = sql.Column(sql.DateTime, default=now, onupdate=now, nullable=False)

    # Relationships
    query_execution = relationship(
        "QueryExecution",
        backref=backref(
            "review", uselist=False, cascade="all, delete-orphan", passive_deletes=True
        ),
    )
    reviewer = relationship(
        "User",
        foreign_keys=[reviewed_by],
        backref=backref(
            "reviewed_query_reviews", cascade="all, delete-orphan", passive_deletes=True
        ),
    )
    assigned_reviewers = relationship(
        "User",
        secondary="query_execution_reviewer",
        backref=backref("assigned_query_reviews", cascade="all", passive_deletes=True),
    )

    @with_formatted_date
    def to_dict(self, with_execution=False):
        data = {
            "id": self.id,
            "query_execution_id": self.query_execution_id,
            "requested_by": self.query_execution.uid if self.query_execution else None,
            "reviewed_by": self.reviewed_by,
            "status": self.get_status(),
            "request_reason": self.request_reason,
            "rejection_reason": self.rejection_reason,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "reviewer_ids": [reviewer.id for reviewer in self.assigned_reviewers],
        }

        if with_execution:
            data["execution"] = (
                self.query_execution.to_dict(
                    with_statement=False,
                    with_query_review=False,  # Prevent circular reference
                )
                if self.query_execution
                else None
            )

        return data

    def get_status(self):
        """
        Determines the current status of the QueryReview based on the associated QueryExecution.

        Returns:
            str: One of 'pending', 'rejected', or 'approved'.
        """
        if not self.query_execution:
            return None

        status = self.query_execution.status
        if status == QueryExecutionStatus.PENDING_REVIEW:
            return "pending"
        elif status == QueryExecutionStatus.REJECTED:
            return "rejected"
        else:
            return "approved"


class QueryExecutionReviewer(Base, CRUDMixin):
    __tablename__ = "query_execution_reviewer"
    __table_args__ = (
        sql.UniqueConstraint(
            "query_review_id", "uid", name="unique_query_execution_reviewer"
        ),
        {"mysql_engine": "InnoDB", "mysql_charset": "utf8mb4"},
    )

    id = sql.Column(sql.Integer, primary_key=True, autoincrement=True)
    query_review_id = sql.Column(
        sql.Integer,
        sql.ForeignKey("query_review.id", ondelete="CASCADE"),
        nullable=False,
    )
    uid = sql.Column(
        sql.Integer,
        sql.ForeignKey("user.id", ondelete="CASCADE"),
        nullable=False,
    )
    created_at = sql.Column(sql.DateTime, default=now, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "query_review_id": self.query_review_id,
            "uid": self.uid,
            "created_at": self.created_at,
        }
