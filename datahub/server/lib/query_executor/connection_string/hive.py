import re
from typing import Dict, Tuple, List, NamedTuple, Optional

from lib.utils.decorators import with_exception_retry
from .helpers.common import (
    split_hostport,
    get_parsed_variables,
    merge_hostport,
    random_choice,
)
from .helpers.zookeeper import get_hostname_and_port_from_zk

# TODO: make these configurable?
MAX_URI_FETCH_ATTEMPTS = 10
MAX_DELAY_BETWEEN_ZK_ATTEMPTS_SEC = 5


class RawHiveConnectionConf(NamedTuple):
    # Raw Connection Configuration that's from a string -> dict transformation
    hosts: List[Tuple[str, Optional[int]]]
    default_db: str
    session_variables: Dict[str, str]
    conf_list: Dict[str, str]
    var_list: Dict[str, str]


class HiveConnectionConf(NamedTuple):
    host: str
    port: Optional[int]
    default_db: str
    configuration: Dict[str, str]


def _extract_connection_url(connection_string: str) -> RawHiveConnectionConf:
    # Parser for Hive JDBC string
    # Loosely based on https://cwiki.apache.org/confluence/display/Hive/HiveServer2+Clients#HiveServer2Clients-JDBC
    match = re.search(
        r"^(?:jdbc:)?hive2:\/\/([\w.-]+(?:\:\d+)?(?:,[\w.-]+(?:\:\d+)?)*)\/(\w*)((?:;[\w.-]+=[\w.-]+)*)(\?[\w.-]+=[\w.-]+(?:;[\w.-]+=[\w.-]+)*)?(\#[\w.-]+=[\w.-]+(?:;[\w.-]+=[\w.-]+)*)?$",  # noqa: E501
        connection_string,
    )

    hosts = match.group(1)
    default_db = match.group(2) or "default"
    session_variables = match.group(3) or ""
    conf_list = match.group(4) or ""
    var_list = match.group(5) or ""

    parsed_hosts = []
    for hostport in hosts.split(","):
        parsed_hosts.append(split_hostport(hostport))

    parsed_session_variables = get_parsed_variables(session_variables[1:])
    parsed_conf_list = get_parsed_variables(conf_list[1:])
    parsed_var_list = get_parsed_variables(var_list[1:])

    return RawHiveConnectionConf(
        hosts=parsed_hosts,
        default_db=default_db,
        session_variables=parsed_session_variables,
        conf_list=parsed_conf_list,
        var_list=parsed_var_list,
    )


@with_exception_retry(
    max_retry=MAX_URI_FETCH_ATTEMPTS,
    get_retry_delay=lambda retry: min(MAX_DELAY_BETWEEN_ZK_ATTEMPTS_SEC, retry),
)
def get_hive_host_port_from_zk(
    connection_conf: RawHiveConnectionConf,
) -> Tuple[str, int]:
    zk_quorum = ",".join(
        map(lambda hostport: merge_hostport(hostport), connection_conf.hosts)
    )
    zk_namespace = connection_conf.session_variables.get("zooKeeperNamespace")

    raw_server_uris = get_hostname_and_port_from_zk(zk_quorum, zk_namespace) or []
    server_uri_dicts = filter(
        lambda d: d is not None,
        [_server_uri_to_dict(raw_server_uri) for raw_server_uri in raw_server_uris],
    )
    server_uris = list(map(lambda d: d["serverUri"], server_uri_dicts))
    random_server_uri = random_choice(server_uris)

    if not random_server_uri:
        raise Exception("Failed to get hostname and port from Zookeeper")
    return split_hostport(random_server_uri)


def _server_uri_to_dict(server_uri: str) -> Optional[Dict[str, str]]:
    match = re.search(r"serverUri=(.*);version=(.*);sequence=(.*)", server_uri)
    if match:
        return {
            "serverUri": match.group(1),
            "version": match.group(2),
            "sequence": match.group(3),
        }


def get_hive_connection_conf(connection_string: str) -> HiveConnectionConf:
    hostname = None
    port = None
    connection_conf = _extract_connection_url(connection_string)

    # We use zookeeper to find host name
    if connection_conf.session_variables.get("serviceDiscoveryMode") == "zooKeeper":
        hostname, port = get_hive_host_port_from_zk(connection_conf)
    else:  # We just return a normal host
        hostname, port = random_choice(connection_conf.hosts, default=(None, None))

    return HiveConnectionConf(
        host=hostname,
        port=port,
        default_db=connection_conf.default_db,
        configuration=connection_conf.conf_list,
    )
