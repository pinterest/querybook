from app.datasource import register
from lib.metastore import get_metastore_loader
from logic import data_element as logic


@register("/data_element/<int:data_element_id>/metastore_link/", methods=["GET"])
def get_data_element_metastore_link(data_element_id: int):
    data_element = logic.get_data_element_by_id(data_element_id)
    metastore_id = data_element.metastore_id
    metastore_loader = get_metastore_loader(metastore_id)

    return metastore_loader.get_data_element_metastore_link(name=data_element.name)
