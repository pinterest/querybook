from app.auth.permission import verify_data_column_permission
from app.datasource import register
from lib.logger import get_logger
from lib.metastore import get_metastore_loader
from logic import data_element as logic
from const.data_element import DataElementAssociationDict

LOG = get_logger(__file__)


@register(
    "/column/<int:column_id>/data_element/",
    methods=["GET"],
)
def get_data_element_by_column_id(column_id: int) -> DataElementAssociationDict:
    verify_data_column_permission(column_id)
    associations = logic.get_data_element_associations_by_column_id(column_id=column_id)

    if not associations:
        return None

    # check if there are more than 1 association type
    association_types = set([r.type for r in associations])
    if len(association_types) > 1:
        LOG.error(
            f"Column {column_id} has more than one data element associated with it"
        )
        return None

    data_element = {}
    for row in associations:
        data_element["type"] = row.type.value
        data_element[row.property_name] = (
            row.data_element.to_dict() if row.data_element else row.primitive_type
        )
    return data_element


@register("/data_element/<int:data_element_id>/metastore_link/", methods=["GET"])
def get_data_element_metastore_link(data_element_id: int):
    data_element = logic.get_data_element_by_id(data_element_id)
    metastore_id = data_element.metastore_id
    metastore_loader = get_metastore_loader(metastore_id)

    return metastore_loader.get_data_element_metastore_link(name=data_element.name)
