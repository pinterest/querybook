from lib.data_doc.all_dag_exporter import get_dag_exporter_class


def export_dag(nodes, edges, meta, dag_exporter_name):
    dag_exporter = get_dag_exporter_class(dag_exporter_name)
    return dag_exporter.export(nodes=nodes, edges=edges, meta=meta)
