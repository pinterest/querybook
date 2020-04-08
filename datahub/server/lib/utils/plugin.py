from importlib import import_module
from lib.logger import get_logger

LOG = get_logger(__file__)


def import_plugin(
    plugin_path: str, plugin_variable: str = None, default_val=None,
):
    """Import the DataHub plugin values

    Arguments:
        plugin_path {str} -- Path to the plugin module file

    Keyword Arguments:
        plugin_variable {str} -- Exported variable in module, if not supplied whole module is returned (default: {None})
        default_val {any} -- Default value if the returned value is None,
                             if not provided import error may raise  (default: {None})

    Raises:
        err: ImportError for invalid module

    Returns:
        Any -- The corresponding plugin value
    """

    try:
        plugin_value = import_module(plugin_path)

        if plugin_variable is not None:
            plugin_value = getattr(plugin_value, plugin_variable, None)

        if plugin_value is None and default_val is not None:
            plugin_value = default_val

        return plugin_value
    except (ImportError, ModuleNotFoundError) as err:
        # Silence this err
        LOG.error(f"Cannot import {plugin_path}.{plugin_variable} due to: {str(err)}")
        if default_val is None:
            raise err
        else:
            return default_val
