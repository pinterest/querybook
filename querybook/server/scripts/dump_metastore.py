from lib.metastore import load_metastore
from logic.admin import get_all_query_metastore


def dump_metastore():
    ids = map(lambda m: m.id, get_all_query_metastore())
    for mid in ids:
        load_metastore(mid)


if __name__ == "__main__":
    dump_metastore()
