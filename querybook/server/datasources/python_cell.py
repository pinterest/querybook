from app.auth.permission import verify_data_cell_permission
from app.datasource import register
from lib.data_doc.data_cell import PythonOutputType, validate_python_output
from lib.logger import get_logger
from logic import datadoc as logic

LOG = get_logger(__file__)


@register("/python_cell/<int:cell_id>/result/", methods=["GET"])
def get_python_cell_result(cell_id: int):
    verify_data_cell_permission(cell_id)
    return logic.get_python_cell_result_by_data_cell_id(data_cell_id=cell_id)


@register("/python_cell/<int:cell_id>/result/", methods=["PUT"])
def create_or_update_python_cell_result(
    cell_id: int, output: PythonOutputType = [], error: str = None
):
    validate_python_output(output)
    verify_data_cell_permission(cell_id)
    return logic.create_or_update_python_cell_result(
        data_cell_id=cell_id, output=output, error=error
    )
