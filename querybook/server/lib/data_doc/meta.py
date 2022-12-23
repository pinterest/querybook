from typing import Dict, Any
from .doc_types import DataDocMeta, DataDocMetaVarConfig


def check_variable_type(val: Any):
    if isinstance(val, (int, float)):
        return "number"
    elif isinstance(val, bool):
        return "boolean"
    elif isinstance(val, str):
        return "string"

    # this shouldn't happen, just in case
    return "string"


def convert_if_legacy_datadoc_meta_v0(datadoc_meta: Dict) -> DataDocMeta:
    """Converts the old meta format which is only a dictionary of templated variables
       to a more general format that has templated vars as array plus other fields

        Old meta: `{ "foo": "bar" }`
        New meta: `{ "variables": ["name": "foo", "type": "string", "value": "bar", ...] }`

        If the new meta is passed in, no change would be made.

    Args:
        datadoc_meta (Dict): Old/New meta format

    Returns:
        DataDocMeta: New meta format
    """
    if isinstance(datadoc_meta.get("variables"), list):
        return datadoc_meta

    new_meta = {"variables": []}

    for name, value in datadoc_meta.items():
        new_meta["variables"].append(
            {"name": name, "value": value, "type": check_variable_type(value)}
        )

    return new_meta


def convert_if_legacy_datadoc_meta(datadoc_meta: Dict) -> DataDocMeta:
    datadoc_meta = convert_if_legacy_datadoc_meta_v0(datadoc_meta)
    return datadoc_meta


def var_config_to_var_dict(variables: list[DataDocMetaVarConfig]) -> Dict:
    var_dict = {}

    for config in variables:
        var_dict[config["name"]] = config["value"]

    return var_dict


valid_meta_keys = ["variables"]


def validate_datadoc_meta(datadoc_meta: DataDocMeta) -> bool:
    for key in datadoc_meta.keys():
        if key not in valid_meta_keys:
            return False

    if "variables" in datadoc_meta:
        variables = datadoc_meta["variables"]
        if not isinstance(variables, list):
            return False

        for variable_config in variables:
            var_type = variable_config["type"]
            var_val = variable_config["value"]

            if var_type == "string" and not isinstance(var_val, str):
                return False
            if var_type == "boolean" and not isinstance(var_val, bool):
                return False
            if var_type == "number" and not isinstance(var_val, (float, int)):
                return False

    return True
