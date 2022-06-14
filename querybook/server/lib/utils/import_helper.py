from importlib import import_module
from typing import Any, List, Tuple, Union
from lib.logger import get_logger

LOG = get_logger(__file__)


def import_modules(
    module_paths: List[Union[str, Tuple[str, str]]], include_none: bool = False
) -> List[Any]:
    """Import multiple modules, the invalid paths will be ignored

    Args:
        module_paths (List[Union[str, Tuple[str, str]]]): List of module paths (str) or (module path, module var) pairs
        include_none {bool} If true, then invalid path variables will be imported as None
    Returns:
        List[Any]: Imported modules or module variables
    """
    imported_vars = []

    for module_path in module_paths:
        import_path = None
        import_variable = None
        if isinstance(module_path, str):
            import_path = module_path
        else:
            import_path, import_variable = module_path

        imported_var = import_module_with_default(
            import_path, import_variable, default=None
        )
        if imported_var is not None or include_none:
            imported_vars.append(imported_var)

    return imported_vars


def import_module_with_default(module_path: str, module_variable: str = None, **kwargs):
    """Same as import_module, but has a default parameter to suppress error

    Arguments:
        module_path {str} -- Absolute path to the module file

    Keyword Arguments:
        module_variable {str} -- Exported variable in module, if not supplied whole module is returned (default: {None})
        default {any} -- Default value if the returned value is None,
                         if not provided import error may raise  (default: {None})

    Raises:
        err: ImportError for invalid module

    Returns:
        Any -- The corresponding plugin value
    """
    has_default = "default" in kwargs
    try:
        plugin_value = import_module(module_path)

        if module_variable is not None:
            plugin_value = getattr(plugin_value, module_variable, None)

        if not plugin_value and has_default:
            plugin_value = kwargs["default"]

        return plugin_value
    except (ImportError, ModuleNotFoundError) as err:
        # Suppress this err
        LOG.debug(f"Cannot import {module_path}.{module_variable} due to: {str(err)}")
        if not has_default:
            raise err
        else:
            return kwargs["default"]
