from app.db import with_session

from logic.admin import get_query_metastore_by_id
from lib.metastore.base_metastore_loader import BaseMetastoreLoader


def get_metastore_loader_class_by_name(name: str) -> BaseMetastoreLoader:
    from lib.metastore.all_loaders import ALL_METASTORE_LOADERS

    for loader in ALL_METASTORE_LOADERS:
        if loader.__name__ == name:
            return loader
    raise ValueError(f"Unknown loader name {name}")


@with_session
def get_metastore_loader(metastore_id: int, session=None) -> BaseMetastoreLoader:
    metastore = get_query_metastore_by_id(id=metastore_id, session=session)
    metastore_dict = metastore.to_dict_admin()
    return get_metastore_loader_class_by_name(metastore_dict["loader"])(metastore_dict)


def load_metastore(metastore_id: int):
    loader = get_metastore_loader(metastore_id)
    loader.load()
