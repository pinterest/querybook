import random
import time
from typing import List
from thrift.transport.TTransport import TTransportException
from socket import error as SocketError

from hmsclient.genthrift.hive_metastore.ttypes import (
    MetaException,
    InvalidObjectException,
)
from hmsclient import hmsclient

from lib.logger import get_logger

_LOG = get_logger(__file__)

_DEFAULT_RETRY_INTERVAL_SECONDS = 5
_DEFAULT_NUM_RETRIES = 6


class HiveMetastoreClient:
    def __init__(
        self,
        hmss_ro_addrs=[],
        hmss_rw_addrs=[],
        retry_interval_seconds=_DEFAULT_RETRY_INTERVAL_SECONDS,
        num_retries=_DEFAULT_NUM_RETRIES,
    ):
        self._ro_host_addrs = hmss_ro_addrs
        self._rw_host_addrs = hmss_rw_addrs

        # Randomize order of hosts for load balancing
        random.shuffle(self._ro_host_addrs)
        random.shuffle(self._rw_host_addrs)

        self._next_ro_index = 0
        self._next_rw_index = 0
        self._read_client = None
        self._write_client = None
        self._num_retries = num_retries
        self._retry_interval_seconds = retry_interval_seconds

    def __del__(self):
        self._close_client(self._read_client)
        self._close_client(self._write_client)

    # Connection utils:
    @staticmethod
    def _get_host_port_from_addr(addr):
        """
        Turns a server addresses into a tuple of host and port
        Args:
            addr: a server address e.g. 'hive-metastoreserver-20170227-ro-001:9083'

        Returns:
            host, port from the address e.g. 'hive-metastoreserver-20170227-ro-001',9083

        """
        hostport = addr.split(":")
        if len(hostport) == 1:
            return hostport[0], "9083"
        return hostport[0], int(hostport[1])

    def _get_current_ro_hostport(self):
        return self._ro_host_addrs[self._next_ro_index]

    def _get_current_rw_hostport(self):
        return self._rw_host_addrs[self._next_rw_index]

    def _move_to_next_ro_index(self):
        self._close_client(self._read_client)
        self._read_client = None
        self._next_ro_index = (self._next_ro_index + 1) % len(self._ro_host_addrs)

    def _move_to_next_rw_index(self):
        self._close_client(self._write_client)
        self._write_client = None
        self._next_rw_index = (self._next_rw_index + 1) % len(self._rw_host_addrs)

    @staticmethod
    def _create_client(host, port):
        client = hmsclient.HMSClient(host=host, port=port)
        client.open()
        return client

    def _close_client(self, client):
        if client is not None:
            client.close()

    def _try_to_connect_write(self):
        if self._write_client:
            return
        host, port = self._get_host_port_from_addr(self._get_current_rw_hostport())
        self._write_client = self._create_client(host, port)

    def _try_to_connect_read(self):
        if self._read_client:
            return
        host, port = self._get_host_port_from_addr(self._get_current_ro_hostport())
        self._read_client = self._create_client(host, port)

    def _perform_op(
        self,
        function_to_connect,
        function_to_run,
        function_for_node_info,
        function_to_move_to_next_hostport,
        log_error=True,
    ):
        output = None
        for i in range(self._num_retries):
            try:
                function_to_connect()
                output = function_to_run()
            except (
                TTransportException,
                MetaException,
                InvalidObjectException,
                SocketError,
            ) as ex:
                _LOG.warning(
                    "Failed to connect to hive metastore at %s"
                    % function_for_node_info()
                )
                function_to_move_to_next_hostport()
                if i == self._num_retries - 1:
                    _LOG.warning(
                        "Maximum number of retries reached after %d attempts, giving up",
                        self._num_retries,
                    )
                    _LOG.error(ex, exc_info=True)
                    raise ex
                else:
                    _LOG.warning(
                        "Sleeping for %d seconds after attempt %d",
                        self._retry_interval_seconds,
                        i + 1,
                    )
                    time.sleep(self._retry_interval_seconds)
            except Exception as ex:
                # It did succeed in connecting, but got some other exception
                if log_error:
                    _LOG.error(
                        "Got an error when querying metastore at {}:".format(
                            function_for_node_info()
                        )
                    )
                    _LOG.error(ex, exc_info=True)
                raise ex
        return output

    def _perform_read_op(self, function_to_run, log_error=True):
        return self._perform_op(
            function_to_connect=self._try_to_connect_read,
            function_to_run=function_to_run,
            function_for_node_info=self._get_current_ro_hostport,
            function_to_move_to_next_hostport=self._move_to_next_ro_index,
            log_error=log_error,
        )

    def _perform_write_op(self, function_to_run, log_error=True):
        return self._perform_op(
            function_to_connect=self._try_to_connect_write,
            function_to_run=function_to_run,
            function_for_node_info=self._get_current_rw_hostport,
            function_to_move_to_next_hostport=self._move_to_next_rw_index,
            log_error=log_error,
        )

    def get_all_databases(self):
        """
        Returns: The names of all the databases in the hive metastore

        """
        _LOG.info("Get all databases from hive metastore")
        return self._perform_read_op(lambda: self._read_client.get_all_databases())

    def get_database(self, db_name: str):
        """Get database/schema info

        Args:
            db_name (str): database name

        Returns:
            DataBase: Object with the following type: https://github.com/apache/hive/blob/master/standalone-metastore/metastore-common/src/main/thrift/hive_metastore.thrift#L404
        """
        _LOG.info("Get db info %s", db_name)
        return self._perform_read_op(lambda: self._read_client.get_database(db_name))

    def get_all_tables(self, db_name):
        """
        Args:
            db_name: The name of a hive database

        Returns: The names of all the tables in the database

        """
        _LOG.info("Get all tables from db %s", db_name)
        return self._perform_read_op(lambda: self._read_client.get_all_tables(db_name))

    def get_table(self, db_name, tb_name):
        """
        Queries the hive metastore for table info such as
          - createTime
          - lastAccessTime
          - retention
          - sd
          - partitionKeys
          - parameters
          - viewOriginalText
          - viewExpandedText
          - tableType
          - privileges a table

        Args:
            db_name: The name of the database
            tb_name: The name of the table

        Returns:
            hive_metastore.ttypes.Table object
        """
        return self._perform_read_op(
            lambda: self._read_client.get_table(db_name, tb_name)
        )

    def _get_table_partition_keys(self, db_name: str, tb_name: str) -> List[str]:
        """
        Queries the hive metastore DB for table partition keys

        Args:
            db_name: The name of the db
            tb_name: The name of the table

        Returns:  List[str] The partitions keys of the table
        """
        table = self.get_table(db_name, tb_name)
        partition_keys = [key.name for key in table.partitionKeys or []]
        return partition_keys

    def get_filtered_partitions(
        self, db_name: str, tb_name: str, filter_clause: str
    ) -> List[str]:
        """
        Queries the hive metastore DB for table partitions given a filter

        Args:
            db_name: The name of the db
            tb_name: The name of the table
            filter_clause: Filter conditions formatted as a SQL WHERE clause. e.g. "dt=2016-03-14 AND hr=00"

        Returns: List[str] The partitions of db_name.tb_name in the format ['dt=2016-03-14/hr=00', 'dt=2016-03-14/hr=01', ...]
        """
        partitions = self._perform_read_op(
            lambda: self._read_client.get_partitions_by_filter(
                db_name, tb_name, filter_clause, -1
            )
        )
        partition_keys = self._get_table_partition_keys(db_name, tb_name)
        partition_names = [
            format_partition_from_keys_and_values(partition_keys, partition.values)
            for partition in partitions
        ]
        return partition_names

    def get_partitions(self, db_name, tb_name, filter_clause: str = None):
        """
        Queries the hive metastore DB for table partitions

        Args:
            db_name: The name of the db
            tb_name: The name of the table
            filter_clause: Filter conditions formatted as a SQL WHERE clause. e.g. "dt=2016-03-14 AND hr=00"

        Returns: The partitions of db_name.tb_name in the format ['dt=2016-03-14/hr=00', 'dt=2016-03-14/hr=01', ...]

        """
        _LOG.info("Get partitions of %s.%s", db_name, tb_name)
        if filter_clause:
            return self.get_filtered_partitions(db_name, tb_name, filter_clause)
        return self._perform_read_op(
            lambda: self._read_client.get_partition_names(db_name, tb_name, -1)
        )


def format_partition_from_keys_and_values(
    partition_keys: List[str], partition_values: List[str]
) -> str:
    """Returns formatted partition name from partition_keys list and partition_values list

    Args:
        partition_keys {List[str]} -- List of partition keys e.g. ["dt", "hr"]
        partition_values {List[str]} -- List of partition values e.g. ["2021-01-01", "01"]

    Returns:
        str -- Formatted partition name e.g. "dt=2021-01-01/hr=01"
    """
    partition_name = "/".join(
        f"{key}={value}" for key, value in zip(partition_keys, partition_values)
    )
    return partition_name
