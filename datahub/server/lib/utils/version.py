import os
from const.path import PROJECT_ROOT_PATH
from lib.utils.json import safe_loads

__version = None


def get_version():
    global __version
    if __version is None:
        with open(os.path.join(PROJECT_ROOT_PATH, "./package.json")) as f:
            package_config = safe_loads(f.read(), default_value={})
            __version = package_config.get("version", None)
    return __version
