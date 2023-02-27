from typing import Dict, List, Tuple

from clients.hms_client import HiveMetastoreClient
from const.metastore import DataColumn, DataTable
from lib.form import ExpandableFormField, FormField, StructFormField
from lib.metastore.loaders.form_fileds import load_partitions_field
from lib.metastore.loaders.hive_metastore_loader import HMSMetastoreLoader
from lib.query_executor.clients.hive import HiveClient


class HMSThriftMetastoreLoader(HMSMetastoreLoader):
    def __init__(self, metastore_dict: Dict):
        self._cursor = self._get_hive_cursor(metastore_dict)
        super(HMSThriftMetastoreLoader, self).__init__(metastore_dict)

    @classmethod
    def get_metastore_params_template(cls):
        return StructFormField(
            (
                "hive_resource_manager",
                FormField(
                    description="Provide resource manager link here to provide insights"
                ),
            ),
            (
                "connection_string",
                FormField(
                    required=True,
                    description="Put your JDBC connection string here",
                    regex="^(?:jdbc:)?hive2:\\/\\/([\\w.-]+(?:\\:\\d+)?(?:,[\\w.-]+(?:\\:\\d+)?)*)\\/(\\w*)((?:;[\\w.-]+=[\\w.-]+)*)(\\?[\\w.-]+=[\\w.-]+(?:;[\\w.-]+=[\\w.-]+)*)?(\\#[\\w.-]+=[\\w.-]+(?:;[\\w.-]+=[\\w.-]+)*)?$",  # noqa: E501
                    helper="""
<p>
Format
jdbc:hive2://&lt;host1&gt;:&lt;port1&gt;,&lt;host2&gt;:&lt;port2&gt;/dbName;sess_var_list?hive_conf_list#hive_var_list
</p>
<p>Currently support zookeeper in session var, and will pass any conf variables to HS2</p>
<p>See [here](https://cwiki.apache.org/confluence/display/Hive/HiveServer2+Clients#HiveServer2Clients-JDBC) for more details.
</p>""",
                ),
            ),
            ("username", FormField(regex="\\w+")),
            ("password", FormField(hidden=True)),
            (
                "hms_connection",
                ExpandableFormField(
                    of=FormField(
                        required=True,
                        description="Put url to hive metastore server here",
                    ),
                    min=1,
                ),
            ),
            ("load_partitions", load_partitions_field),
        )

    def get_table_and_columns(
        self, schema_name, table_name
    ) -> Tuple[DataTable, List[DataColumn]]:
        table, columns = super(HMSThriftMetastoreLoader, self).get_table_and_columns(
            schema_name, table_name
        )
        if table:
            query = f"desc {schema_name}.{table_name}"
            self._cursor.run(query, run_async=False)

            # First row contains only headers
            thrift_columns = self._cursor.get()[1:]
            seen = set()

            for column in thrift_columns:
                name = column[0]
                if name == "" or name.startswith("#"):
                    continue

                if name not in seen:
                    columns.append(
                        DataColumn(name=name, type=column[1], comment=column[2])
                    )
                seen.add(name)
        return table, columns

    def _get_hmc(self, metastore_dict):
        return HiveMetastoreClient(
            hmss_ro_addrs=metastore_dict["metastore_params"]["hms_connection"]
        )

    def _get_hive_cursor(self, metastore_dict):
        return HiveClient(
            connection_string=metastore_dict["metastore_params"]["connection_string"],
            username=metastore_dict["metastore_params"]["username"],
            password=metastore_dict["metastore_params"]["password"],
        ).cursor()
