from lib.data_doc.base_dag_exporter import BaseDAGExporter
from lib.logger import get_logger
from lib.form import StructFormField, FormField
from lib.form import FormFieldType


LOG = get_logger(__file__)


airflow_dag = """
from datetime import datetime, timedelta
from textwrap import dedent

from airflow import DAG

from airflow.operators.bash import MySqlOperator

with DAG(
    "{title}",
    # These args will get passed on to each operator
    # You can override them on a per-task basis during operator initialization
    default_args={
        "depends_on_past": False,
        "email": ["airflow@example.com"],
        "email_on_failure": False,
        "email_on_retry": False,
        "retries": 1,
        "retry_delay": timedelta(minutes=5),
    },
    description="{description}",
    schedule_interval=timedelta(days=1),
    start_date=datetime(2021, 1, 1),
    catchup=False,
    tags=["example"],
) as dag:
"""


class DemoDAGExporter(BaseDAGExporter):
    @property
    def dag_exporter_name(self):
        return "demo"

    @property
    def dag_exporter_type(self):
        return "text"

    @property
    def dag_exporter_meta(self):
        # TODO: use FormField
        return StructFormField(
            input=FormField(description="sample input field"),
            checkbox=FormField(field_type=FormFieldType.Boolean),
            select=FormField(
                field_type=FormFieldType.Select,
                options=["Sample Option 1", "Sample Option 2"],
            ),
        )

    def export(self, nodes, edges, meta):
        try:
            export_dag = ""

            for node in nodes:
                node_section = '''\n
    query_{id} = r"""{query}"""

    task{id} = MySqlOperator(
        dag=dag, task_id="cell_{id}", sql=query_{id}
    )
                '''.format(
                    query=node["data"]["query"], id=node["id"]
                )
                export_dag = export_dag + node_section

            source_to_target = {}
            for edge in edges:
                source_id = str(edge["source"])
                source_to_target.setdefault(source_id, []).append(edge["target"])

            for source, targets in source_to_target.items():
                for target in targets:
                    export_dag = (
                        export_dag
                        + "\n    task_{}.set_downstream(task_{})".format(source, target)
                    )

            return {
                "type": self.dag_exporter_type,
                "export": airflow_dag + export_dag,
            }
        except Exception as e:
            LOG.info(e)
