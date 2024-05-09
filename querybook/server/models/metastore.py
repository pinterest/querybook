import sqlalchemy as sql
from app import db
from const.db import (
    description_length,
    mediumtext_length,
    name_length,
    now,
    type_length,
    url_length,
    utf8mb4_name_length,
)
from const.metastore import DataTableWarningSeverity
from lib.sqlalchemy import CRUDMixin, TruncateString
from sqlalchemy.orm import backref, relationship

Base = db.Base


class TableLineage(Base):
    __tablename__ = "table_lineage"
    __table_args__ = (
        sql.UniqueConstraint(
            "table_id",
            "parent_table_id",
            "job_metadata_id",
            name="unique_table_lineage",
        ),
    )

    id = sql.Column(sql.Integer, primary_key=True)
    table_id = sql.Column(
        sql.Integer,
        sql.ForeignKey(
            "data_table.id", ondelete="CASCADE", name="table_lineage_table_fk"
        ),
    )
    parent_table_id = sql.Column(
        sql.Integer,
        sql.ForeignKey(
            "data_table.id", ondelete="CASCADE", name="table_lineage_parent_table_fk"
        ),
    )
    job_metadata_id = sql.Column(
        sql.Integer,
        sql.ForeignKey(
            "data_job_metadata.id",
            ondelete="CASCADE",
            name="table_lineage_job_metadata_fk",
        ),
    )

    table = relationship(
        "DataTable",
        backref=backref("table_lineage", cascade="all, delete", passive_deletes=True),
        foreign_keys=[table_id],
    )
    parent_table = relationship(
        "DataTable",
        backref=backref(
            "parent_table_lineage", cascade="all, delete", passive_deletes=True
        ),
        foreign_keys=[parent_table_id],
    )
    job_metadata = relationship(
        "DataJobMetadata",
        backref=backref("table_lineage", cascade="all, delete", passive_deletes=True),
    )

    def to_dict(self, include_table=False):
        table_lineage_dict = {
            "id": self.id,
            "table_id": self.table_id,
            "parent_table_id": self.parent_table_id,
            "job_metadata_id": self.job_metadata_id,
            "table_name": self.table.name,
            "parent_name": self.parent_table.name,
        }

        if include_table:
            table_lineage_dict["table"] = [s.to_dict() for s in self.table]
            table_lineage_dict["parent_table"] = [
                s.to_dict() for s in self.parent_table
            ]

        return table_lineage_dict


class DataJobMetadata(Base):
    __tablename__ = "data_job_metadata"
    __table_args__ = {"mysql_engine": "InnoDB", "mysql_charset": "utf8mb4"}

    id = sql.Column(sql.Integer, primary_key=True)
    job_name = sql.Column(sql.String(length=utf8mb4_name_length), index=True)
    job_info = sql.Column(sql.JSON)
    job_owner = sql.Column(sql.String(length=name_length))
    query_text = sql.Column(sql.Text(length=mediumtext_length))
    is_adhoc = sql.Column(sql.Boolean)

    metastore_id = sql.Column(
        sql.Integer,
        sql.ForeignKey(
            "query_metastore.id", name="job_metadata_metastore_fk", ondelete="CASCADE"
        ),
    )
    metastore = relationship(
        "QueryMetastore",
        backref=backref("job_metadata", cascade="all, delete", passive_deletes=True),
    )

    def to_dict(self):
        complete_dict = {
            "id": self.id,
            "job_name": self.job_name,
            "job_info": self.job_info,
            "job_owner": self.job_owner,
            "query_text": self.query_text,
            "is_adhoc": self.is_adhoc,
            "metastore_id": self.metastore_id,
        }
        return complete_dict


class DataSchema(TruncateString("name"), Base):
    __tablename__ = "data_schema"

    id = sql.Column(sql.Integer, primary_key=True)
    created_at = sql.Column(sql.DateTime, default=now)
    updated_at = sql.Column(sql.DateTime, default=now)

    name = sql.Column(sql.String(length=name_length), index=True)
    table_count = sql.Column(sql.Integer)
    description = sql.Column(sql.Text(length=mediumtext_length))

    metastore_id = sql.Column(
        sql.Integer, sql.ForeignKey("query_metastore.id", ondelete="CASCADE")
    )
    metastore = relationship(
        "QueryMetastore",
        backref=backref("schemas", cascade="all, delete", passive_deletes=True),
    )

    tables = relationship(
        "DataTable", backref="data_schema", cascade="all, delete", passive_deletes=True
    )

    def to_dict(self, include_metastore=False, include_table=False):
        schema_dict = {
            "id": self.id,
            "name": self.name,
            "table_count": self.table_count,
            "description": self.description,
            "metastore_id": self.metastore_id,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }

        if include_metastore:
            schema_dict["metastore"] = self.metastore.to_dict()
        if include_table:
            schema_dict["table"] = [s.to_dict() for s in self.tables]

        return schema_dict


class DataTable(CRUDMixin, TruncateString("name", "type", "location"), Base):
    __tablename__ = "data_table"

    id = sql.Column(sql.Integer, primary_key=True)
    created_at = sql.Column(sql.DateTime, default=now)
    updated_at = sql.Column(sql.DateTime, default=now)

    name = sql.Column(sql.String(length=name_length), index=True)
    type = sql.Column(sql.String(length=name_length), index=True)

    # This field is no longer being used, keep it here for backward compatibility only.
    # Table ownership will be fully managed by DataTableOwnership
    owner = sql.Column(sql.String(length=name_length))

    table_created_at = sql.Column(sql.DateTime)
    table_updated_by = sql.Column(sql.String(length=name_length))
    table_updated_at = sql.Column(sql.DateTime)

    data_size_bytes = sql.Column(sql.BigInteger)
    location = sql.Column(sql.String(length=url_length))
    column_count = sql.Column(sql.Integer)

    schema_id = sql.Column(
        sql.Integer, sql.ForeignKey("data_schema.id", ondelete="CASCADE")
    )
    golden = sql.Column(sql.Boolean, default=False)
    boost_score = sql.Column(sql.Numeric, default=1, nullable=False)

    information = relationship(
        "DataTableInformation",
        uselist=False,
        backref="data_table",
        cascade="all, delete",
        passive_deletes=True,
    )
    columns = relationship(
        "DataTableColumn",
        backref="data_table",
        cascade="all, delete",
        passive_deletes=True,
    )
    ownership = relationship(
        "DataTableOwnership", uselist=False, cascade="all, delete", passive_deletes=True
    )

    def to_dict(
        self,
        include_schema=False,
        include_column=False,
        include_warnings=False,
    ):
        table = {
            "id": self.id,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "name": self.name,
            "type": self.type,
            "owner": self.owner,
            "table_created_at": self.table_created_at,
            "table_updated_by": self.table_updated_by,
            "table_updated_at": self.table_updated_at,
            "data_size_bytes": self.data_size_bytes,
            "location": self.location,
            "column_count": self.column_count,
            "schema_id": self.schema_id,
            "golden": self.golden,
        }

        if self.ownership:
            table["ownership"] = self.ownership.to_dict()
        # update with data table information
        table.update(self.information.to_dict())

        if include_schema:
            table["schema"] = self.data_schema.to_dict()

        if include_column:
            table["column"] = [s.to_dict() for s in self.columns]

        if include_warnings:
            table["warnings"] = self.warnings

        return table


class DataTableInformation(
    TruncateString("latest_partitions", "earliest_partitions"), Base
):
    __tablename__ = "data_table_information"
    __table_args__ = {"mysql_engine": "InnoDB", "mysql_charset": "utf8mb4"}

    id = sql.Column(sql.Integer, primary_key=True)
    data_table_id = sql.Column(
        sql.Integer, sql.ForeignKey("data_table.id", ondelete="CASCADE")
    )

    latest_partitions = sql.Column(sql.String(description_length))
    earliest_partitions = sql.Column(sql.String(description_length))
    description = sql.Column(sql.Text(length=mediumtext_length))
    hive_metastore_description = sql.Column(sql.Text(length=mediumtext_length))
    column_info = sql.Column(sql.JSON)
    custom_properties = sql.Column(sql.JSON)
    table_links = sql.Column(sql.JSON)

    def to_dict(self):
        table_information = {
            "latest_partitions": self.latest_partitions,
            "earliest_partitions": self.earliest_partitions,
            "description": self.description,
            "hive_metastore_description": self.hive_metastore_description,
            "column_info": self.column_info,
            "custom_properties": self.custom_properties,
            "table_links": self.table_links,
        }
        return table_information

    def get_description(self):
        return self.description


class DataTableColumn(TruncateString("name", "type", "comment"), Base):
    __tablename__ = "data_table_column"

    id = sql.Column(sql.Integer, primary_key=True)
    created_at = sql.Column(sql.DateTime, default=now)
    updated_at = sql.Column(sql.DateTime, default=now)

    name = sql.Column(sql.String(length=name_length), index=True)
    type = sql.Column(sql.String(length=type_length))

    comment = sql.Column(sql.String(length=description_length))
    description = sql.Column(sql.Text(length=mediumtext_length))

    table_id = sql.Column(
        sql.Integer, sql.ForeignKey("data_table.id", ondelete="CASCADE")
    )

    data_elements = relationship(
        "DataElement", secondary="data_element_association", uselist=True, viewonly=True
    )
    statistics = relationship(
        "DataTableColumnStatistics",
        uselist=True,
        viewonly=True,
    )

    def to_dict(self, include_table=False):
        column_dict = {
            "id": self.id,
            "name": self.name,
            "type": self.type,
            "comment": self.comment,
            "description": self.description,
            "table_id": self.table_id,
        }

        if include_table:
            column_dict["table"] = self.table.to_dict()
        return column_dict


class DataTableOwnership(Base):
    __tablename__ = "data_table_ownership"
    __table_args__ = (
        sql.UniqueConstraint(
            "data_table_id", "uid", "type", name="unique_table_ownership"
        ),
    )

    id = sql.Column(sql.Integer, primary_key=True)
    data_table_id = sql.Column(
        sql.Integer, sql.ForeignKey("data_table.id", ondelete="CASCADE"), nullable=False
    )
    created_at = sql.Column(sql.DateTime, default=now)
    uid = sql.Column(
        sql.Integer, sql.ForeignKey("user.id", ondelete="CASCADE"), nullable=False
    )
    type = sql.Column(sql.String(name_length))

    def to_dict(self):
        item = {
            "id": self.id,
            "data_table_id": self.data_table_id,
            "created_at": self.created_at,
            "uid": self.uid,
            "type": self.type,
        }
        return item


class DataTableQueryExecution(CRUDMixin, Base):
    __tablename__ = "data_table_query_execution"

    id = sql.Column(sql.Integer, primary_key=True, autoincrement=True)
    table_id = sql.Column(
        sql.Integer, sql.ForeignKey("data_table.id", ondelete="CASCADE"), nullable=False
    )
    cell_id = sql.Column(
        sql.Integer,
        sql.ForeignKey("data_cell.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    query_execution_id = sql.Column(
        sql.Integer,
        sql.ForeignKey("query_execution.id", ondelete="CASCADE"),
        nullable=False,
    )

    table = relationship(
        "DataTable",
        backref=backref(
            "table_query_execution", cascade="all, delete", passive_deletes=True
        ),
        foreign_keys=[table_id],
    )
    query_execution = relationship(
        "QueryExecution",
        backref=backref(
            "table_query_execution", cascade="all, delete", passive_deletes=True
        ),
        foreign_keys=[query_execution_id],
    )


class DataTableWarning(CRUDMixin, Base):
    __tablename__ = "data_table_warnings"

    id = sql.Column(sql.Integer, primary_key=True, autoincrement=True)
    table_id = sql.Column(
        sql.Integer, sql.ForeignKey("data_table.id", ondelete="CASCADE"), nullable=False
    )
    message = sql.Column(sql.String(description_length))
    severity = sql.Column(sql.Enum(DataTableWarningSeverity), nullable=False)

    created_at = sql.Column(sql.DateTime, default=now)
    updated_at = sql.Column(sql.DateTime, default=now)
    created_by = sql.Column(sql.Integer, sql.ForeignKey("user.id", ondelete="CASCADE"))
    updated_by = sql.Column(sql.Integer, sql.ForeignKey("user.id", ondelete="CASCADE"))

    table = relationship(
        "DataTable",
        backref=backref("warnings", cascade="all, delete", passive_deletes=True),
        foreign_keys=[table_id],
    )


class DataTableStatistics(CRUDMixin, Base):
    __tablename__ = "data_table_statistics"

    id = sql.Column(sql.Integer, primary_key=True)
    table_id = sql.Column(
        sql.Integer, sql.ForeignKey("data_table.id", ondelete="CASCADE"), nullable=False
    )
    key = sql.Column(sql.String(length=utf8mb4_name_length), nullable=False, index=True)
    value = sql.Column(sql.JSON, nullable=False)
    uid = sql.Column(
        sql.Integer, sql.ForeignKey("user.id", ondelete="SET NULL"), nullable=True
    )

    table = relationship(
        "DataTable",
        backref=backref(
            "table_statistics", cascade="all, delete", passive_deletes=True
        ),
        foreign_keys=[table_id],
    )


class DataTableColumnStatistics(CRUDMixin, Base):
    __tablename__ = "data_table_column_statistics"

    id = sql.Column(sql.Integer, primary_key=True)
    column_id = sql.Column(
        sql.Integer,
        sql.ForeignKey("data_table_column.id", ondelete="CASCADE"),
        nullable=False,
    )
    key = sql.Column(sql.String(length=utf8mb4_name_length), nullable=False, index=True)
    value = sql.Column(sql.JSON, nullable=False)
    uid = sql.Column(
        sql.Integer, sql.ForeignKey("user.id", ondelete="SET NULL"), nullable=True
    )

    column = relationship(
        "DataTableColumn",
        backref=backref(
            "table_statistics", cascade="all, delete", passive_deletes=True
        ),
        foreign_keys=[column_id],
    )
