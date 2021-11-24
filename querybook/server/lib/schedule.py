from lib.utils.import_helper import import_module_with_default

ALL_PLUGIN_JOBS = import_module_with_default(
    "job_plugin", "ALL_PLUGIN_JOBS", default={}
)

ALL_JOBS = {**{}, **ALL_PLUGIN_JOBS}
