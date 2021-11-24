from collections import namedtuple

from lib.utils.import_helper import import_module_with_default

PROVIDED_RESULT_STORES_PATHS = {
    "db": ("lib.result_store.stores.db_store", "DBReader", "DBUploader"),
    "s3": ("lib.result_store.stores.s3_store", "S3Reader", "S3Uploader"),
    "gcs": ("lib.result_store.stores.google_store", "GoogleReader", "GoogleUploader"),
    "file": ("lib.result_store.stores.file_store", "FileReader", "FileUploader"),
}
ResultStore = namedtuple("ResultStore", ["reader", "uploader"])


def import_provided_stores():
    provided_result_stores = {}
    for (
        store_name,
        (store_path, reader_name, uploader_name),
    ) in PROVIDED_RESULT_STORES_PATHS.items():
        store_module = import_module_with_default(store_path, default=None)
        if store_module is not None:
            reader = getattr(store_module, reader_name)
            uploader = getattr(store_module, uploader_name)

            if reader and uploader:
                provided_result_stores[store_name] = ResultStore(reader, uploader)
    return provided_result_stores


PROVIDED_RESULT_STORES = import_provided_stores()
ALL_PLUGIN_RESULT_STORES = import_module_with_default(
    "result_store_plugin", "ALL_PLUGIN_RESULT_STORES", default={}
)


ALL_RESULT_STORES = {
    **PROVIDED_RESULT_STORES,
    **ALL_PLUGIN_RESULT_STORES,
}
