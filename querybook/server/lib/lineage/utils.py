from env import QuerybookSettings

from lib.utils.import_helper import import_module_with_default

lineage = import_module_with_default(QuerybookSettings.DATA_LINEAGE_BACKEND)
