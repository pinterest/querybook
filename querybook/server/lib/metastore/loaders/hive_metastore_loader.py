from typing import Dict, List, Tuple
from lib.form import ExpandableFormField, FormField
from hmsclient.genthrift.hive_metastore.ttypes import NoSuchObjectException

from clients.hms_client import HiveMetastoreClient
from lib.metastore.base_metastore_loader import (
    BaseMetastoreLoader,
    DataTable,
    DataColumn,
)
from lib.utils import json as ujson


class HMSMetastoreLoader(BaseMetastoreLoader):
    def __init__(self, metastore_dict: Dict):
        self.hmc = self._get_hmc(metastore_dict)
        super(HMSMetastoreLoader, self).__init__(metastore_dict)

    def __del__(self):
        del self.hmc

    @classmethod
    def get_metastore_params_template(cls):
        return ExpandableFormField(
            of=FormField(
                required=True, description="Put url to hive metastore server here"
            ),
            min=1,
        )

    def get_all_schema_names(self) -> List[str]:
        return self.hmc.get_all_databases()

    def get_all_table_names_in_schema(self, schema_name: str) -> List[str]:
        return self.hmc.get_all_tables(schema_name)

    def get_table_and_columns(
        self, schema_name, table_name
    ) -> Tuple[DataTable, List[DataColumn]]:
        description = get_hive_metastore_table_description(
            self.hmc, schema_name, table_name
        )
        if not description:
            return None, []

        parameters = description.parameters
        sd = description.sd
        partitions = self.get_partitions(schema_name, table_name)

        last_modified_time = parameters.get("last_modified_time")
        last_modified_time = (
            int(last_modified_time) if last_modified_time is not None else None
        )

        total_size = parameters.get("totalSize")
        total_size = int(total_size) if total_size is not None else None

        table = DataTable(
            name=description.tableName,
            type=description.tableType,
            owner=description.owner,
            table_created_at=description.createTime,
            table_updated_by=parameters.get("last_modified_by"),
            table_updated_at=last_modified_time,
            data_size_bytes=total_size,
            location=sd.location,
            partitions=partitions,
            raw_description=ujson.pdumps(description, default=lambda o: o.__dict__),
        )

        columns = list(
            map(
                lambda col: DataColumn(
                    name=col.name, type=col.type, comment=col.comment
                ),
                sd.cols + description.partitionKeys,
            )
        )
        return table, columns

    def get_partitions(
        self, schema_name: str, table_name: str, conditions: Dict[str, str] = None
    ) -> List[str]:
        return get_hive_metastore_table_partitions(
            self.hmc, schema_name, table_name, conditions
        )

    def _get_hmc(self, metastore_dict):
        return HiveMetastoreClient(hmss_ro_addrs=metastore_dict["metastore_params"])


def get_hive_metastore_table_description(hmc, db_name, table_name):
    try:
        description = hmc.get_table(db_name, table_name)
        return description
    except NoSuchObjectException:
        return None


def get_partition_filter_from_conditions(conditions: Dict[str, str] = None):
    if conditions is None:
        return None
    conditions_list = [
        f"{condition_key}='{condition_value}'"
        for condition_key, condition_value in conditions.items()
    ]
    condition_str = " AND ".join(conditions_list)
    return condition_str


def get_hive_metastore_table_partitions(
    hmc, db_name, table_name, conditions: Dict[str, str] = None
):
    filter_clause = get_partition_filter_from_conditions(conditions)
    try:
        return hmc.get_partitions(db_name, table_name, filter_clause)
    except NoSuchObjectException:
        return None
