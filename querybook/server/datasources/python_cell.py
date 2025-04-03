from typing import Dict, List, Any, Literal, TypedDict, Union

from app.auth.permission import verify_data_cell_permission
from app.datasource import register
from lib.logger import get_logger
from logic import datadoc as logic

LOG = get_logger(__file__)


class PythonOutputDataFrameDataType(TypedDict):
    columns: List[str]
    records: List[Dict[str, Any]]


class PythonOutputDictType(TypedDict):
    type: Literal["dataframe", "image", "json"]
    data: Union[str, PythonOutputDataFrameDataType]


# Define a type alias for the output list
PythonOutputType = List[Union[str, PythonOutputDictType]]


@register("/python_cell/<int:cell_id>/result/", methods=["GET"])
def get_python_cell_result(cell_id: int):
    verify_data_cell_permission(cell_id)
    return logic.get_python_cell_result_by_data_cell_id(data_cell_id=cell_id)


def validate_output(output: PythonOutputType) -> None:
    if not isinstance(output, list):
        raise ValueError("Output must be a list.")

    for item in output:
        if not isinstance(item, (str, dict)):
            raise ValueError(
                "Each element in the output must be either a string or a dictionary."
            )
        if isinstance(item, dict):
            if "type" not in item or "data" not in item:
                raise ValueError(
                    "Each dictionary in the output must contain 'type' and 'data' keys."
                )
            if item["type"] not in {"dataframe", "image", "json"}:
                raise ValueError(
                    "The 'type' key in the dictionary must be one of 'dataframe', 'image', or 'json'."
                )
            if item["type"] == "dataframe":
                if "columns" not in item["data"] or "records" not in item["data"]:
                    raise ValueError(
                        "The 'data' dictionary must contain 'columns' and 'records' keys."
                    )
                if not isinstance(item["data"]["columns"], list):
                    raise ValueError(
                        "The 'columns' key in the 'data' dictionary must be a list."
                    )
                if not isinstance(item["data"]["records"], list):
                    raise ValueError(
                        "The 'records' key in the 'data' dictionary must be a list."
                    )


@register("/python_cell/<int:cell_id>/result/", methods=["PUT"])
def create_or_update_python_cell_result(
    cell_id: int, output: PythonOutputType = [], error: str = None
):
    validate_output(output)
    verify_data_cell_permission(cell_id)
    return logic.create_or_update_python_cell_result(
        data_cell_id=cell_id, output=output, error=error
    )
