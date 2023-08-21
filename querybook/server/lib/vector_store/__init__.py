from env import QuerybookSettings

from .all_embeddings import get_embeddings_class
from .all_vector_stores import get_vector_store_class

__embeddings = None
__vector_store = None


def get_embeddings():
    global __embeddings
    if __embeddings:
        return __embeddings

    embeddings_provider = QuerybookSettings.EMBEDDINGS_PROVIDER

    if not embeddings_provider:
        return None

    embeddings_config = QuerybookSettings.EMBEDDINGS_CONFIG

    embeddings_class = get_embeddings_class(embeddings_provider)
    __embeddings = embeddings_class(**embeddings_config)
    return __embeddings


def get_vector_store():
    global __vector_store
    if __vector_store:
        return __vector_store

    vector_store_provider = QuerybookSettings.VECTOR_STORE_PROVIDER
    if not vector_store_provider:
        return None

    vector_store_config = QuerybookSettings.VECTOR_STORE_CONFIG
    vector_store_class = get_vector_store_class(vector_store_provider)

    embeddings = get_embeddings()

    if not embeddings:
        return None

    embeddings_arg_name = vector_store_config.get(
        "embeddings_arg_name", "embedding_function"
    )

    kwargs = {
        embeddings_arg_name: get_embeddings(),
        **vector_store_config,
    }
    if "embeddings_arg_name" in kwargs:
        del kwargs["embeddings_arg_name"]

    __vector_store = vector_store_class(**kwargs)
    return __vector_store
