from collections import namedtuple

from lib.utils.plugin import import_plugin
from .stores.db_store import DBReader, DBUploader
from .stores.s3_store import S3Reader, S3Uploader
from .stores.google_store import GoogleReader, GoogleUploader

ALL_PLUGIN_RESULT_STORES = import_plugin(
    "result_store_plugin", "ALL_PLUGIN_RESULT_STORES", {}
)

ResultStore = namedtuple("ResultStore", ["reader", "uploader"])
ALL_RESULT_STORES = {
    "db": ResultStore(DBReader, DBUploader),
    "s3": ResultStore(S3Reader, S3Uploader),
    "gcs": ResultStore(GoogleReader, GoogleUploader),  # Google Cloud Storage
    **ALL_PLUGIN_RESULT_STORES,
}
