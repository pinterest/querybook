import sqlalchemy as sql
from app import db
from const.db import mediumtext_length, name_length, now, type_length
from const.data_element import (
    DataElementAssociationProperty,
    DataElementAssociationType,
)
from lib.sqlalchemy import CRUDMixin
from sqlalchemy.orm import relationship

Base = db.Base


class DataElement(CRUDMixin, Base):
    __tablename__ = "data_element"
    __table_args__ = {"mysql_engine": "InnoDB", "mysql_charset": "utf8mb4"}

    id = sql.Column(sql.Integer, primary_key=True)
    created_at = sql.Column(sql.DateTime, default=now)
    updated_at = sql.Column(sql.DateTime, default=now)
    created_by = sql.Column(
        sql.Integer, sql.ForeignKey("user.id", ondelete="SET NULL"), nullable=True
    )
    metastore_id = sql.Column(
        sql.Integer,
        sql.ForeignKey("query_metastore.id", ondelete="CASCADE"),
        nullable=False,
    )
    name = sql.Column(
        sql.String(length=name_length), index=True, unique=True, nullable=False
    )
    # The string representation of the data element’s underlying data type
    type = sql.Column(sql.String(length=type_length), nullable=False)
    description = sql.Column(sql.Text(length=mediumtext_length), nullable=True)
    properties = sql.Column(sql.JSON, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "metastore_id": self.metastore_id,
            "name": self.name,
            "type": self.type,
            "description": self.description,
            "properties": self.properties,
        }


class DataElementAssociation(CRUDMixin, Base):
    __tablename__ = "data_element_association"

    id = sql.Column(sql.Integer, primary_key=True)
    created_at = sql.Column(sql.DateTime, default=now)
    updated_at = sql.Column(sql.DateTime, default=now)
    column_id = sql.Column(
        sql.Integer,
        sql.ForeignKey("data_table_column.id", ondelete="CASCADE"),
        nullable=False,
    )
    type = sql.Column(
        sql.Enum(DataElementAssociationType),
        default=DataElementAssociationType.REF,
        nullable=False,
    )
    property_name = sql.Column(
        sql.String(length=name_length),
        default=DataElementAssociationProperty.VALUE.value,
        nullable=False,
    )
    data_element_id = sql.Column(
        sql.Integer,
        sql.ForeignKey("data_element.id", ondelete="CASCADE"),
        nullable=True,
    )
    # primitive type is only used by "MAP" association type
    primitive_type = sql.Column(sql.String(length=type_length), nullable=True)

    data_element = relationship("DataElement")

    def to_dict(self):
        return {
            "column_id": self.column_id,
            "type": self.type.value,
            "property_name": self.property_name,
            "data_element_id": self.data_element_id,
            "data_element": self.data_element.to_dict() if self.data_element else None,
            "primitive_type": self.primitive_type,
        }
