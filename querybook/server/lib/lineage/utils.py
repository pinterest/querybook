from env import QuerybookSettings

from lib.utils.plugin import import_plugin

lineage = import_plugin(QuerybookSettings.DATA_LINEAGE_BACKEND)
