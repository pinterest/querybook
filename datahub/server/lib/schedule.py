from lib.utils.plugin import import_plugin

ALL_PLUGIN_JOBS = import_plugin("job_plugin", "ALL_PLUGIN_JOBS", {})

ALL_JOBS = {**{}, **ALL_PLUGIN_JOBS}
