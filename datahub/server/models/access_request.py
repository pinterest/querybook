import sqlalchemy as sql
from app import db

Base = db.Base


class AccessRequest(Base):
    __tablename__ = "access_request"
    __table_args__ = (
        sql.UniqueConstraint(
            "data_doc_id", "uid", name="unique_data_doc_access_request"
        ),
        sql.UniqueConstraint(
            "query_execution_id", "uid", name="unique_query_execution_access_request"
        ),
    )
    id = sql.Column(sql.Integer, primary_key=True, autoincrement=True)
    uid = sql.Column(sql.Integer, sql.ForeignKey("user.id", ondelete="CASCADE"))
    data_doc_id = sql.Column(
        sql.Integer, sql.ForeignKey("data_doc.id", ondelete="CASCADE"), nullable=True
    )
    query_execution_id = sql.Column(
        sql.Integer,
        sql.ForeignKey("query_execution.id", ondelete="CASCADE"),
        nullable=True,
    )

    def to_dict(self):
        return {
            "id": self.id,
            "uid": self.uid,
            "data_doc_id": self.data_doc_id,
            "query_execution_id": self.query_execution_id,
        }
