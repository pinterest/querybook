import sqlalchemy as sql
from sqlalchemy.orm import backref, relationship

from app import db
from const.db import name_length, now, description_length, mediumtext_length
from const.data_doc import DataCellType
from lib.sqlalchemy import CRUDMixin

Base = db.Base


class DataDoc(Base, CRUDMixin):
    __tablename__ = "data_doc"
    __table_args__ = {"mysql_engine": "InnoDB", "mysql_charset": "utf8mb4"}

    id = sql.Column(sql.Integer, primary_key=True, autoincrement=True)

    environment_id = sql.Column(
        sql.Integer,
        sql.ForeignKey("environment.id", ondelete="CASCADE"),
        nullable=False,
    )
    # Controls whether or not anyone can view it
    public = sql.Column(sql.Boolean, default=True, nullable=False)
    # When archived, data doc will be hidden from everyone
    archived = sql.Column(sql.Boolean, default=False, nullable=False)

    # AKA creator
    owner_uid = sql.Column(sql.Integer, sql.ForeignKey("user.id", ondelete="CASCADE"))
    created_at = sql.Column(sql.DateTime, default=now, nullable=False)
    updated_at = sql.Column(sql.DateTime, default=now, nullable=False)

    title = sql.Column(sql.String(length=name_length), default="", nullable=False)
    meta = sql.Column(sql.JSON, default={}, nullable=False)

    cells = relationship(
        "DataCell",
        secondary="data_doc_data_cell",
        backref=backref("doc", uselist=False),
        order_by="DataDocDataCell.cell_order",
    )

    owner = relationship("User", uselist=False)

    environment = relationship(
        "Environment",
        uselist=False,
        backref=backref("data_docs", cascade="all, delete", passive_deletes=True),
    )

    def to_dict(self, with_cells=False):
        data_doc_dict = {
            "id": self.id,
            "environment_id": self.environment_id,
            "public": self.public,
            "archived": self.archived,
            "owner_uid": self.owner_uid,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "meta": self.meta,
            "title": self.title,
        }

        if with_cells:
            data_doc_dict["cells"] = [c.to_dict() for c in self.cells]

        return data_doc_dict

    def get_query_cells(self):
        return [cell for cell in self.cells if cell.cell_type == DataCellType.query]


class DataCell(Base):
    __tablename__ = "data_cell"
    __table_args__ = {"mysql_engine": "InnoDB", "mysql_charset": "utf8mb4"}

    id = sql.Column(sql.Integer, primary_key=True, autoincrement=True)
    cell_type = sql.Column(sql.Enum(DataCellType), nullable=False)

    context = sql.Column(sql.Text(length=mediumtext_length))
    meta = sql.Column(sql.JSON)

    created_at = sql.Column(sql.DateTime, default=now, nullable=False)
    updated_at = sql.Column(sql.DateTime, default=now, nullable=False)

    query_executions = relationship(
        "QueryExecution",
        secondary="data_cell_query_execution",
        backref=backref("cells", order_by="DataCell.id"),
        order_by="QueryExecution.id.desc()",
    )

    def to_dict(self, with_query_executions=False):
        item = {
            "id": self.id,
            "cell_type": self.cell_type.name,
            "context": self.context,
            "meta": self.meta,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }

        if with_query_executions:
            item["query_executions"] = [qe.to_dict() for qe in self.query_executions]

        return item


class DataDocDataCell(Base):
    __tablename__ = "data_doc_data_cell"

    id = sql.Column(sql.Integer, primary_key=True, autoincrement=True)
    data_doc_id = sql.Column(
        sql.Integer, sql.ForeignKey("data_doc.id", ondelete="CASCADE"), nullable=False
    )
    data_cell_id = sql.Column(
        sql.Integer,
        sql.ForeignKey("data_cell.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    cell_order = sql.Column(sql.Integer)

    def to_dict(self):
        return {
            "data_doc_id": self.data_doc_id,
            "data_cell_id": self.data_cell_id,
            "cell_order": self.cell_order,
        }


class DataDocEditor(Base):
    __tablename__ = "data_doc_editor"
    __table_args__ = (
        sql.UniqueConstraint("data_doc_id", "uid", name="unique_data_doc_user"),
    )

    id = sql.Column(sql.Integer, primary_key=True, autoincrement=True)
    data_doc_id = sql.Column(
        sql.Integer, sql.ForeignKey("data_doc.id", ondelete="CASCADE")
    )
    uid = sql.Column(sql.Integer, sql.ForeignKey("user.id", ondelete="CASCADE"))

    read = sql.Column(sql.Boolean, default=False, nullable=False)
    write = sql.Column(sql.Boolean, default=False, nullable=False)

    user = relationship("User", uselist=False)

    data_doc = relationship(
        "DataDoc",
        uselist=False,
        backref=backref("editors", cascade="all, delete", passive_deletes=True),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "data_doc_id": self.data_doc_id,
            "uid": self.uid,
            "read": self.read,
            "write": self.write,
        }


class QuerySnippet(Base):
    __tablename__ = "query_snippet"
    __table_args__ = {"mysql_engine": "InnoDB", "mysql_charset": "utf8mb4"}

    id = sql.Column(sql.Integer, primary_key=True)
    context = sql.Column(sql.Text(length=mediumtext_length))

    title = sql.Column(sql.String(length=name_length), nullable=False)
    engine_id = sql.Column(
        sql.Integer, sql.ForeignKey("query_engine.id", ondelete="CASCADE")
    )
    description = sql.Column(sql.String(length=description_length))
    is_public = sql.Column(sql.Boolean, nullable=False)
    golden = sql.Column(sql.Boolean, nullable=False, default=False)

    created_at = sql.Column(sql.DateTime, default=now, nullable=False)
    created_by = sql.Column(sql.Integer, sql.ForeignKey("user.id", ondelete="CASCADE"))

    updated_at = sql.Column(sql.DateTime, default=now, nullable=False)
    last_updated_by = sql.Column(
        sql.Integer, sql.ForeignKey("user.id", ondelete="CASCADE")
    )

    def to_dict(self):
        return {
            "id": self.id,
            "context": self.context,
            "title": self.title,
            "description": self.description,
            "engine_id": self.engine_id,
            "is_public": self.is_public,
            "golden": self.golden,
            "created_at": self.created_at,
            "created_by": self.created_by,
            "updated_at": self.updated_at,
            "last_updated_by": self.last_updated_by,
        }


class FavoriteDataDoc(Base):
    __tablename__ = "favorite_data_doc"

    id = sql.Column(sql.Integer, primary_key=True)
    data_doc_id = sql.Column(
        sql.Integer, sql.ForeignKey("data_doc.id", ondelete="CASCADE")
    )
    uid = sql.Column(sql.Integer, sql.ForeignKey("user.id", ondelete="CASCADE"))

    def to_dict(self):
        return {
            "id": self.id,
            "data_doc_id": self.data_doc_id,
            "uid": self.uid,
        }


class FunctionDocumentation(Base):
    __tablename__ = "function_documentation"
    __table_args__ = {"mysql_engine": "InnoDB", "mysql_charset": "utf8mb4"}

    id = sql.Column(sql.Integer, primary_key=True)
    language = sql.Column(sql.String(length=name_length), nullable=False)
    name = sql.Column(sql.String(length=name_length), nullable=False)
    params = sql.Column(sql.String(length=name_length), nullable=False)
    return_type = sql.Column(sql.String(length=name_length), nullable=False)
    description = sql.Column(sql.String(length=description_length))

    def to_dict(self):
        item = {
            "id": self.id,
            "language": self.language,
            "name": self.name,
            "params": self.params,
            "return_type": self.return_type,
            "description": self.description,
        }

        return item


class DataCellQueryExecution(Base):
    __tablename__ = "data_cell_query_execution"

    id = sql.Column(sql.Integer, primary_key=True, autoincrement=True)
    query_execution_id = sql.Column(
        sql.Integer,
        sql.ForeignKey("query_execution.id", ondelete="CASCADE"),
        nullable=False,
    )
    data_cell_id = sql.Column(
        sql.Integer, sql.ForeignKey("data_cell.id", ondelete="CASCADE"), nullable=False
    )
    latest = sql.Column(sql.Boolean, default=False, nullable=False)

    def to_dict(self):
        return {
            "query_execution_id": self.query_execution_id,
            "data_cell_id": self.data_cell_id,
            "latest": self.latest,
        }


class DataDocDAGExport(CRUDMixin, Base):
    __tablename__ = "data_doc_dag_export"

    id = sql.Column(sql.Integer, primary_key=True, autoincrement=True)
    data_doc_id = sql.Column(
        sql.Integer,
        sql.ForeignKey("data_doc.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )

    created_at = sql.Column(sql.DateTime, default=now, nullable=False)
    updated_at = sql.Column(sql.DateTime, default=now, nullable=False)

    dag = sql.Column(sql.JSON, default={}, nullable=False)
    meta = sql.Column(sql.JSON, default={}, nullable=False)
