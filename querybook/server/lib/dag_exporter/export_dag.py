from app.db import with_session
from logic.datadoc import get_dag_export_by_data_doc_id
from logic.datadoc import get_data_doc_by_id

from .all_dag_exporter import get_dag_exporter_class


@with_session
def export_dag(data_doc_id, dag_exporter_name, session=None):
    dag_exporter = get_dag_exporter_class(dag_exporter_name)
    dag_export = get_dag_export_by_data_doc_id(
        data_doc_id=data_doc_id, session=session
    ).to_dict()
    dag = dag_export["dag"]

    doc = get_data_doc_by_id(data_doc_id, session=session)
    cell_by_id = {cell.id: cell for cell in doc.cells}

    return dag_exporter.export(
        nodes=dag["nodes"],
        edges=dag["edges"],
        meta=dag_export["meta"]["exporter_meta"][dag_exporter_name],
        cell_by_id=cell_by_id,
    )
