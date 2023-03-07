from app.db import with_session
from const.metastore import (
    DataElementAssociationProperty,
    DataElementAssociationTuple,
    DataElementAssociationType,
    DataElementTuple,
)
from lib.logger import get_logger
from logic.user import get_user_by_name
from models.data_element import DataElement, DataElementAssociation

LOG = get_logger(__file__)


@with_session
def get_data_element_by_id(id: int, session=None):
    return DataElement.get(id=id, session=session)


@with_session
def get_data_element_by_name(name: str, session=None):
    return session.query(DataElement).filter(DataElement.name == name).first()


@with_session
def get_data_element_by_column_id(column_id: int, session=None):
    results = (
        session.query(DataElementAssociation)
        .filter(DataElementAssociation.column_id == column_id)
        .all()
    )

    if not results:
        return None

    # check if there are more than 1 association type
    association_types = set([r.type for r in results])
    if len(association_types) > 1:
        LOG.error(
            f"Column {column_id} has more than one data element associated with it"
        )
        return None

    resp = {}
    for row in results:
        resp["type"] = row.type.value
        resp[row.property_name.value] = (
            row.data_element.to_dict() if row.data_element else row.primitive_type
        )
    return resp


@with_session
def create_or_update_data_element(
    metastore_id: int, data_element_tuple: DataElementTuple, commit=True, session=None
):
    if data_element_tuple.created_by:
        created_by = get_user_by_name(data_element_tuple.created_by, session=session)
        if not created_by:
            LOG.error(
                f"Can't find created_by of data element {data_element_tuple.name}: {data_element_tuple.created_by}"
            )

        data_element_tuple.created_by = created_by or None

    data_element = get_data_element_by_name(data_element_tuple.name, session=session)
    fields = {**data_element_tuple._asdict(), "metastore_id": metastore_id}

    if not data_element:
        # create a new data element
        data_element = DataElement.create(fields=fields, commit=commit, session=session)
    else:
        # update the data element
        data_element = DataElement.update(
            id=data_element.id, fields=fields, commit=commit, session=session
        )

    if commit:
        session.commit()
    else:
        session.flush()


@with_session
def create_data_element_association_by_name(
    data_element_name: str,
    column_id: int,
    association_type: DataElementAssociationType,
    property_name: DataElementAssociationProperty,
    primitive_type: str = None,
    session=None,
):
    data_element = None
    if data_element_name:
        data_element = get_data_element_by_name(data_element_name, session=session)

    if not data_element and not primitive_type:
        LOG.error(
            f"Can not create DataElementAssociation: {data_element_name} is not a valid data element name and primitive type is empty"
        )
        return None

    return DataElementAssociation(
        column_id=column_id,
        type=association_type,
        property_name=property_name,
        data_element_id=data_element.id,
        primitive_type=primitive_type,
    )


@with_session
def create_column_data_element_association(
    column_id: int,
    data_element_association: DataElementAssociationTuple,
    commit=True,
    session=None,
):
    """This function is used for loading column tags from metastore."""
    # delete the current data element association of the column
    session.query(DataElementAssociation).filter_by(column_id=column_id).delete()

    if data_element_association is not None:
        value_association = create_data_element_association_by_name(
            data_element_name=data_element_association.value,
            column_id=column_id,
            association_type=data_element_association.type,
            property_name=DataElementAssociationProperty.VALUE,
            primitive_type=data_element_association.value_primitive,
            session=session,
        )

        if (
            value_association
            and data_element_association.type == DataElementAssociationType.MAP
        ):
            key_association = create_data_element_association_by_name(
                data_element_name=data_element_association.key,
                column_id=column_id,
                association_type=data_element_association.type,
                property_name=DataElementAssociationProperty.KEY,
                primitive_type=data_element_association.key_primitive,
                session=session,
            )

            # add both key and value association only if they are both not None
            if key_association and value_association:
                session.add_all([value_association, key_association])

        elif value_association:
            session.add(value_association)

    if commit:
        session.commit()
    else:
        session.flush()
