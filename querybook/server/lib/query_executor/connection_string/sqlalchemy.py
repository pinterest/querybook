from typing import Dict
from lib.utils.json import safe_loads


def create_sqlalchemy_engine(connection_params: Dict):
    from sqlalchemy import create_engine

    connection_string, connect_args = _get_sqlalchemy_create_engine_kwargs(
        connection_params
    )
    return create_engine(connection_string, connect_args=connect_args)


def _get_sqlalchemy_create_engine_kwargs(connection_params: Dict) -> Dict:
    """Transform the input params to input fields of
       sqlalchemy.create_engine

    Args:
        connection_params (Dict): Assume this is a dict described by
                                  templates.sqlalchemy_template
    Returns:
        Dict: The return value should be acceptable to create_engine(**return_val)
    """
    connection_string = connection_params.get("connection_string", "")
    connect_args_config = connection_params.get("connect_args", [])
    connect_args = {}

    for arg_config in connect_args_config:
        key = arg_config.get("key", None)
        value = arg_config.get("value", None)
        is_json = arg_config.get("isJson", False)

        if key is None or value is None:
            continue

        if is_json:
            json_value = safe_loads(value)
            if json_value is None:
                # JSON Value is invalid
                continue
            value = json_value
        connect_args[key] = value

    return connection_string, connect_args
