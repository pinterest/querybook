from lib.utils.import_helper import import_module_with_default


def _default_check_restricted_query_access() -> bool:
    """Default access control: allow all requests."""
    return True


# Deployments can override this by defining `check_restricted_query_access`
# in an `access_control_plugin` module on the PYTHONPATH. The function
# takes no arguments but can inspect Flask's `request` and `current_user`
# context, and should return True to allow or False to deny the request.
# See plugins/access_control_plugin/__init__.py for a template.
check_restricted_query_access = import_module_with_default(
    "access_control_plugin",
    "check_restricted_query_access",
    default=_default_check_restricted_query_access,
)
