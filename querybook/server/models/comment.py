import sqlalchemy as sql
from app import db
from lib.sqlalchemy import CRUDMixin
from const.db import mediumtext_length, name_length, now
from sqlalchemy.orm import relationship

Base = db.Base


class Comment(CRUDMixin, Base):
    __tablename__ = "comment"

    id = sql.Column(sql.Integer, primary_key=True)

    created_at = sql.Column(sql.DateTime, default=now)
    updated_at = sql.Column(sql.DateTime, default=now)
    created_by = sql.Column(
        sql.Integer, sql.ForeignKey("user.id", ondelete="SET NULL"), nullable=True
    )

    text = sql.Column(sql.Text(length=mediumtext_length))

    parent_comment_id = sql.Column(
        sql.Integer,
        sql.ForeignKey("comment.id", ondelete="CASCADE"),
        nullable=True,
    )

    children = relationship(
        "Comment",
        primaryjoin="Comment.id == Comment.parent_comment_id",
        remote_side=[parent_comment_id],
        uselist=True,
    )
    reactions = relationship("CommentReaction", backref="comment", uselist=True)

    def to_dict(self):
        return {
            "id": self.id,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "created_by": self.created_by,
            "text": self.text,
            "parent_comment_id": self.parent_comment_id,
            "child_comment_ids": [child.to_dict()["id"] for child in self.children],
            "reactions": [reaction.to_dict() for reaction in self.reactions],
        }


class CommentReaction(CRUDMixin, Base):
    __tablename__ = "comment_reaction"
    # TODO: add this to alembic
    __table_args__ = (
        sql.UniqueConstraint(
            "comment_id",
            "created_by",
            "reaction",
            name="unique_comment_reaction",
        ),
    )

    id = sql.Column(sql.Integer, primary_key=True, autoincrement=True)
    comment_id = sql.Column(
        sql.Integer,
        sql.ForeignKey("comment.id", ondelete="CASCADE"),
        nullable=False,
    )
    reaction = sql.Column(sql.String(length=name_length), nullable=False)
    created_by = sql.Column(
        sql.Integer, sql.ForeignKey("user.id", ondelete="SET NULL"), nullable=True
    )


class DataTableComment(CRUDMixin, Base):
    __tablename__ = "data_table_comment"

    id = sql.Column(sql.Integer, primary_key=True, autoincrement=True)
    data_table_id = sql.Column(
        sql.Integer,
        sql.ForeignKey("data_table.id", ondelete="CASCADE"),
        nullable=False,
    )
    comment_id = sql.Column(
        sql.Integer,
        sql.ForeignKey("comment.id", ondelete="CASCADE"),
        nullable=False,
    )


class DataCellComment(CRUDMixin, Base):
    __tablename__ = "data_cell_comment"

    id = sql.Column(sql.Integer, primary_key=True, autoincrement=True)
    data_cell_id = sql.Column(
        sql.Integer,
        sql.ForeignKey("data_cell.id", ondelete="CASCADE"),
        nullable=False,
    )
    comment_id = sql.Column(
        sql.Integer,
        sql.ForeignKey("comment.id", ondelete="CASCADE"),
        nullable=False,
    )
