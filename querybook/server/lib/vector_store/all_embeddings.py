from typing import Type

from lib.utils.import_helper import import_module_with_default
from langchain.embeddings.base import Embeddings
from langchain.embeddings import OpenAIEmbeddings


PROVIDED_EMBEDDINGS = {"openai": OpenAIEmbeddings}

ALL_PLUGIN_EMBEDDINGS = import_module_with_default(
    "vector_store_plugin",
    "ALL_PLUGIN_EMBEDDINGS",
    default={},
)

ALL_EMBEDDINGS = {**PROVIDED_EMBEDDINGS, **ALL_PLUGIN_EMBEDDINGS}


def get_embeddings_class(name: str) -> Type[Embeddings]:
    if name in ALL_EMBEDDINGS:
        return ALL_EMBEDDINGS.get(name)

    raise ValueError(f"Unknown embeddings provider {name}")
