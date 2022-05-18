from lib.data_doc.base_dag_exporter import BaseDAGExporter
from lib.logger import get_logger
from lib.form import StructFormField, FormField
from lib.form import FormFieldType


LOG = get_logger(__file__)


airflow_dag = """
from datetime import datetime, timedelta
from textwrap import dedent

from airflow import DAG

from airflow.operators.bash import BashOperator

with DAG(
    "tutorial",
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
    description="Demo DAG",
    schedule_interval=timedelta(days=1),
    start_date=datetime(2021, 1, 1),
    catchup=False,
    tags=["example"],
) as dag:\n
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
                node_section = '''
    query = """{}"""
    templated_query = dedent(query)

    node{} = BashOperator(
        task_id="cell_{}", depends_on_past=False, bash_command=templated_query,
    )
                '''.format(
                    node["data"]["query"], node["id"], node["id"]
                )
                export_dag = export_dag + node_section

            source_to_target = {}
            for edge in edges:
                source_id = str(edge["source"])
                if source_id in source_to_target:
                    source_to_target[source_id] = source_to_target[source_id].append(
                        edge["target"]
                    )
                else:
                    source_to_target[source_id] = [edge["target"]]

            for key, values in source_to_target.items():
                for value in values:
                    export_dag = (
                        export_dag
                        + "\n    node{}.set_downstream(node{})".format(key, value)
                    )

            return {
                "type": self.dag_exporter_type,
                "export": airflow_dag + export_dag,
            }
        except Exception as e:
            LOG.info(e)
