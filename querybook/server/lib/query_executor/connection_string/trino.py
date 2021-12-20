from typing import NamedTuple, Optional
import re

from .helpers.common import split_hostport, get_parsed_variables, random_choice


class TrinoConnectionConf(NamedTuple):
    host: str
    port: Optional[int]
    catalog: Optional[str]
    schema: Optional[str]

    # From Settings
    protocol: Optional[str]


def get_trino_connection_conf(connection_string: str) -> TrinoConnectionConf:
    match = re.search(
        r"^(?:jdbc:)?trino:\/\/([\w.-]+(?:\:\d+)?(?:,[\w.-]+(?:\:\d+)?)*)(\/\w+)?(\/\w+)?(\?[\w]+=[^&]+(?:&[\w]+=[^&]+)*)?$",  # noqa: E501
        connection_string,
    )

    raw_hosts = match.group(1)
    catalog = (match.group(2) or "/hive")[1:]
    schema = (match.group(3) or "/default")[1:]
    raw_conf = (match.group(4) or "?")[1:]

    parsed_hosts = [split_hostport(hostport) for hostport in raw_hosts.split(",")]
    configurations = get_parsed_variables(raw_conf, separator="&")

    hostname, port = random_choice(parsed_hosts, default=(None, None))
    protocol = "https" if configurations.get("SSL", False) else "http"

    return TrinoConnectionConf(
        host=hostname, port=port, catalog=catalog, schema=schema, protocol=protocol
    )
