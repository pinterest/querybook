import os
import yaml

from const.path import CONFIG_PATH


__config = None


def get_config():
    global __config
    if not __config:
        __config = {}
        for c in os.listdir(CONFIG_PATH):
            with open(os.path.join(CONFIG_PATH, "./{}".format(c))) as f:
                __config[c.split(".")[0]] = yaml.load(f, Loader=yaml.FullLoader)
    return __config


def get_config_value(path, default=None):
    """Get the config value under config/ folder by supplying a path separable with "."

    Arguments:
        path {string} -- the separable path join with .

    Keyword Arguments:
        default {any} -- default value if no result is found (default: {None})

    Returns:
        any -- the config value
    """

    result = get_config()
    parts = path.split(".")

    while parts and result:
        result = result.get(parts.pop(0))

    return result or default
