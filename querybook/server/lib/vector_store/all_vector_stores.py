from typing import Type

from lib.utils.import_helper import import_module_with_default
from lib.vector_store.base_vector_store import VectorStoreBase

ALL_VECTOR_STORES = import_module_with_default(
    "vector_store_plugin",
    "ALL_PLUGIN_VECTOR_STORES",
    default={},
)


def get_vector_store_class(name: str) -> Type[VectorStoreBase]:
    if name in ALL_VECTOR_STORES:
        return ALL_VECTOR_STORES.get(name)

    raise ValueError(f"Unknown vectore store provider {name}")
