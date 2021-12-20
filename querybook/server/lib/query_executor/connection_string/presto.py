from typing import Dict, NamedTuple, Optional
import re

from .helpers.common import split_hostport, get_parsed_variables, random_choice

# Parser for Presto JDBC string
# Loosely based on https://prestodb.github.io/docs/current/installation/jdbc.html


class PrestoConnectionConf(NamedTuple):
    host: str
    port: Optional[int]
    catalog: Optional[str]
    schema: Optional[str]

    # From Settings
    protocol: Optional[str]

    properties: Optional[Dict[str, str]]


def get_presto_connection_conf(connection_string: str) -> PrestoConnectionConf:
    match = re.search(
        r"^(?:jdbc:)?presto:\/\/([\w.-]+(?:\:\d+)?(?:,[\w.-]+(?:\:\d+)?)*)(\/\w+)?(\/\w+)?(\?[\w]+=[^&]+(?:&[\w]+=[^&]+)*)?$",  # noqa: E501
        connection_string,
    )

    raw_hosts = match.group(1)
    catalog = (match.group(2) or "/hive")[1:]
    schema = (match.group(3) or "/default")[1:]
    raw_conf = (match.group(4) or "?")[1:]

    parsed_hosts = [split_hostport(hostport) for hostport in raw_hosts.split(",")]
    hostname, port = random_choice(parsed_hosts, default=(None, None))

    properties = get_parsed_variables(raw_conf, separator="&")
    protocol = "https" if properties.get("SSL", False) else "http"
    properties.pop("SSL", None)

    return PrestoConnectionConf(
        host=hostname,
        port=port,
        catalog=catalog,
        schema=schema,
        protocol=protocol,
        properties=properties,
    )
