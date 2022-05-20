from lib.data_doc.all_dag_exporter import get_dag_exporter_class
from logic.datadoc import get_dag_export_by_data_doc_id
from app.db import with_session
from logic.datadoc import get_data_cell_by_id


@with_session
def export_dag(data_doc_id, dag_exporter_name, session=None):
    dag_exporter = get_dag_exporter_class(dag_exporter_name)
    dag_export = get_dag_export_by_data_doc_id(
        data_doc_id=data_doc_id, session=session
    ).to_dict()
    dag = dag_export["dag"]

    cell_by_node_id = {}
    for node in dag["nodes"]:
        cell = get_data_cell_by_id(id=node["id"], session=session)
        cell_by_node_id[node["id"]] = cell

    return dag_exporter.export(
        nodes=dag["nodes"],
        edges=dag["edges"],
        meta=dag_export["meta"][dag_exporter_name],
        cell_by_node_id=cell_by_node_id,
    )
