from lib.data_doc.base_dag_exporter import BaseDAGExporter
from lib.logger import get_logger
from lib.form import StructFormField, FormField


LOG = get_logger(__file__)

aiflow_dag = """
from datetime import datetime, timedelta

from airflow import DAG

from airflow.operators.bash import MySqlOperator

with DAG(
    "{}",
    description="{}",
    schedule_interval=timedelta(days=1),
    start_date=datetime(2021, 1, 1),
    catchup=False,
) as dag:"""


class DemoDAGExporter(BaseDAGExporter):
    @property
    def dag_exporter_name(self):
        return "demo"

    @property
    def dag_exporter_type(self):
        return "text"

    @property
    def dag_exporter_meta(self):
        return StructFormField(
            title=FormField(description="dag title"),
            description=FormField(description="dag description"),
        )

    def export(self, nodes, edges, meta, cell_by_node_id):
        try:
            export_dag = aiflow_dag.format(meta["title"], meta["description"])

            for node in nodes:
                node_section = '''\n
    query_{id} = r"""{query}"""

    task_{id} = MySqlOperator(
        dag=dag, task_id="cell_{id}", sql=query_{id}
    )
                '''.format(
                    query=cell_by_node_id[node["id"]].context, id=node["id"]
                )
                export_dag = export_dag + node_section

            source_to_target = {}
            for edge in edges:
                source_to_target.setdefault(edge["source"], []).append(edge["target"])

            for source, targets in source_to_target.items():
                for target in targets:
                    export_dag = (
                        export_dag
                        + "\n    task_{}.set_downstream(task_{})".format(source, target)
                    )

            return {
                "type": self.dag_exporter_type,
                "export": export_dag,
            }
        except Exception as e:
            LOG.info(e)
