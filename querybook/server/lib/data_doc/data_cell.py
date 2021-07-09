from lib.config import get_config_value

cell_types = get_config_value("datadoc.cell_types")


def get_valid_meta(input_vals, valid_vals, default_vals=None):
    if type(input_vals) != type(valid_vals):
        raise ValueError(
            f"Invalid meta type, expected {type(valid_vals)} actual {type(input_vals)}"
        )

    if input_vals is None:
        return default_vals

    if isinstance(valid_vals, dict):
        return_obj = {}
        for valid_key, valid_val in valid_vals.items():
            if valid_key in input_vals:
                return_obj[valid_key] = get_valid_meta(
                    input_vals=input_vals[valid_key],
                    valid_vals=valid_val,
                    default_vals=(
                        default_vals.get(valid_key) if default_vals else None
                    ),
                )
            # only for series obj
            elif type(valid_key) == int:
                valid_keys = list(list(valid_vals.values())[0].keys())
                if all(
                    all([i in valid_keys for i in item]) for item in input_vals.values()
                ):
                    return input_vals
        return return_obj
    elif isinstance(valid_vals, list):
        return [
            get_valid_meta(
                input_vals=input_val,
                valid_vals=valid_vals[0],
                default_vals=(default_vals or [None])[0],
            )
            for input_val in input_vals
        ]
    else:
        return input_vals


def sanitize_data_cell_meta(cell_type: str, meta):
    cell_type_info = cell_types[cell_type]

    valid_dict = cell_type_info["meta"]
    default_dict = cell_type_info["meta_default"]

    if meta is None:
        return default_dict

    return get_valid_meta(
        input_vals=meta, valid_vals=valid_dict, default_vals=default_dict
    )
