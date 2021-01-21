from collections import defaultdict
from typing import List

from app.db import with_session
from const.query_execution import QueryExecutionStatus
from lib.export.all_exporters import get_exporter
from logic.datadoc import get_data_doc_by_id
from logic.query_execution import get_last_query_execution_from_cell


@with_session
def export_datadoc(doc_id: int, uid: int, exports: List, session=None):
    if not exports or len(exports) == 0:
        return []

    export_by_cell = group_export_by_cell_id(exports)
    datadoc = get_data_doc_by_id(doc_id, session=session)
    query_cells = datadoc.get_query_cells()
    export_urls = []
    for cell in query_cells:
        if cell.id not in export_by_cell:
            continue

        export_urls.extend(
            _export_query_cell(cell.id, uid, export_by_cell[cell.id], session=session)
        )

    return export_urls


def group_export_by_cell_id(exports: List):
    export_by_cell = defaultdict(list)
    for export in exports:
        export_by_cell[export["exporter_cell_id"]].append(export)
    return export_by_cell


@with_session
def _export_query_cell(cell_id, uid, cell_exports, session=None):
    statement_execution_id = None

    query_execution = get_last_query_execution_from_cell(cell_id, session=session)
    if not query_execution or query_execution.status != QueryExecutionStatus.DONE:
        return [query_execution.status]
    statement_execution_id = query_execution.statement_executions[-1].id

    export_urls = []
    for export in cell_exports:
        exporter_name = export["exporter_name"]
        exporter_params = export.get("exporter_params", {})

        exporter = get_exporter(exporter_name)
        export_urls.append(
            exporter.export(statement_execution_id, uid, **exporter_params)
        )
    return export_urls
