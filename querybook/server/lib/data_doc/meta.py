from typing import Dict, Any
from .doc_types import DataDocMeta


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


def get_datadoc_meta_variables_dict(datadoc_meta: DataDocMeta) -> Dict:
    variables = {}

    for config in datadoc_meta.get("variables", []):
        variables[config["name"]] = config["value"]

    return variables


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
