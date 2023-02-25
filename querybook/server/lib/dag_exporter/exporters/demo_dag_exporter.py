from app.db import with_session
from lib.dag_exporter.base_dag_exporter import BaseDAGExporter
from lib.logger import get_logger
from lib.form import StructFormField, FormField

import re

from logic.admin import get_all_query_engines


LOG = get_logger(__file__)

AIRFLOW_SUCCESS_MSG = """
### DAG exported to {exporter_name} successfully

**Instructions**

1. Copy the dag code below

2. Paste the code to your dag file and make any code changes if needed

3. Create a PR, get it approved and land the change.

**Code**

```py
{dag_code}
```
"""

AIRFLOW_ERROR_MSG = """
### Failed to export DAG to {exporter_name}

```
{error_msg}
```
"""

AIRFLOW_DAG_TEMPLATE = """
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
    def dag_exporter_engines(self) -> str:
        """Demo exporter supports below query engines
        1: sqlite
        """
        # you can return the query engine ids directly
        # return [1]

        # or get the query id based on the language like
        engines = get_all_query_engines()
        return [engine.id for engine in engines if engine.language == "sqlite"]

    @property
    def dag_exporter_meta(self):
        return StructFormField(
            ("name", FormField(description="dag name")),
            ("description", FormField(description="dag description")),
        )

    @with_session
    def export(self, nodes, edges, meta, cell_by_id, session=None):
        name = meta.get("name", "")
        description = meta.get("description", "")

        if not name:
            error_msg = "Dag name can not be empty"
            return {
                "data": AIRFLOW_ERROR_MSG.format(
                    exporter_name=self.dag_exporter_name, error_msg=error_msg
                ),
            }

        export_dag = AIRFLOW_DAG_TEMPLATE.format(name, description)

        task_ids = set()
        for node in nodes:
            node_id = int(node["id"])
            task_ids.add(node_id)

            query_cell = cell_by_id[node_id]

            if not self.is_engine_supported(query_cell):
                error_msg = f"This DAG exporter only supports query engines: {', '.join(self.dag_exporter_engine_names)}"
                return {
                    "data": AIRFLOW_ERROR_MSG.format(
                        exporter_name=self.dag_exporter_name, error_msg=error_msg
                    ),
                }

            title = re.sub(
                r"\s+",
                "_",
                query_cell.meta.get("title", f"untitled_cell_{query_cell.id}"),
            )
            node_section = '''\n
query_{id} = r"""{query}"""

task_{id} = MySqlOperator(
    dag=dag, task_id="{title}", sql=query_{id}
)
            '''.format(
                query=query_cell.context,
                id=node_id,
                title=title,
            )
            export_dag = export_dag + node_section

        for edge in edges:
            source = int(edge["source"])
            target = int(edge["target"])
            if source in task_ids and target in task_ids:
                export_dag = export_dag + "\ntask_{}.set_downstream(task_{})".format(
                    source, target
                )

        return {
            "data": AIRFLOW_SUCCESS_MSG.format(
                exporter_name=self.dag_exporter_name, dag_code=export_dag
            ),
        }
