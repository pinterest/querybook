from kazoo.client import KazooClient
import re
import time
from typing import Dict, Tuple, List, NamedTuple, Optional

from app.flask_app import cache
from .common import split_hostport, get_parsed_variables, merge_hostport, random_choice


# TODO: make these configurable?
MAX_URI_FETCH_ATTEMPTS = 10
CACHE_REFRESH_INTERVAL_SEC = 300
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


def _server_uri_to_dict(server_uri: str) -> Optional[Dict[str, str]]:
    match = re.search(r"serverUri=(.*);version=(.*);sequence=(.*)", server_uri)
    if match:
        return {
            "serverUri": match.group(1),
            "version": match.group(2),
            "sequence": match.group(3),
        }


@cache.memoize(CACHE_REFRESH_INTERVAL_SEC)
def get_hostname_and_port_from_zk(zk_namespace: str, zk_quorum: str) -> Tuple[str, int]:
    server_uris = None

    try:
        zk = KazooClient(hosts=zk_quorum)
        zk.start()
        if not zk.exists(zk_namespace):
            raise Exception(f"{zk_namespace} does not exist on Zookeeper ({zk_quorum})")
        raw_server_uris = zk.get_children(zk_namespace)
        server_uri_dicts = filter(
            lambda d: d is not None,
            [_server_uri_to_dict(raw_server_uri) for raw_server_uri in raw_server_uris],
        )
        server_uris = list(map(lambda d: d["serverUri"], server_uri_dicts))
    finally:
        if zk:
            zk.stop()
            zk.close()
    if server_uris is None:
        raise Exception(
            f"No value found under {zk_namespace} on Zookeeper ({zk_quorum})"
        )
    random_server_uri = random_choice(server_uris)

    if not random_server_uri:
        raise Exception("Failed to get hostname and port from Zookeeper")
    return split_hostport(random_server_uri)


def get_host_port_from_zk_with_retry(
    connection_conf: RawHiveConnectionConf,
) -> Tuple[str, int]:
    zk_quorum = ",".join(
        map(lambda hostport: merge_hostport(hostport), connection_conf.hosts)
    )
    zk_namespace = connection_conf.session_variables.get("zooKeeperNamespace")

    hostname = None
    port = None
    if zk_quorum and zk_namespace:
        attempts = 0

        while not (hostname and port):
            attempts += 1
            try:
                hostname, port = get_hostname_and_port_from_zk(zk_namespace, zk_quorum)
            except Exception as ex:
                if attempts < MAX_URI_FETCH_ATTEMPTS:
                    time.sleep(
                        attempts
                        if attempts < MAX_DELAY_BETWEEN_ZK_ATTEMPTS_SEC
                        else MAX_DELAY_BETWEEN_ZK_ATTEMPTS_SEC
                    )
                else:
                    raise ex
    return hostname, port


def get_hive_connection_conf(connection_string: str) -> HiveConnectionConf:
    hostname = None
    port = None
    connection_conf = _extract_connection_url(connection_string)

    # We use zookeeper to find host name
    if connection_conf.session_variables.get("serviceDiscoveryMode") == "zooKeeper":
        hostname, port = get_host_port_from_zk_with_retry(connection_conf)
    else:  # We just return a normal host
        hostname, port = random_choice(connection_conf.hosts, default=(None, None))

    return HiveConnectionConf(
        host=hostname,
        port=port,
        default_db=connection_conf.default_db,
        configuration=connection_conf.conf_list,
    )
