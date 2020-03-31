from typing import Dict, Tuple, Optional, Sequence
from random import choice


def split_hostport(hostport: str) -> Tuple[str, Optional[int]]:
    split_host = hostport.split(":")
    if len(split_host) == 1:
        split_host.append(None)
    else:
        # Convert port to int
        split_host[1] = int(split_host[1])
    return split_host


def merge_hostport(hostport: Tuple[str, Optional[int]]) -> str:
    host, port = hostport
    if port is None:
        return host
    return f"{host}:{port}"


def get_parsed_variables(
    s: str, separator: str = ";", equal: str = "="
) -> Dict[str, str]:
    result = {}
    if len(s):
        variables = s.split(separator)
        for variable in variables:
            key, value = variable.split(equal)
            result[key] = value

    return result


def random_choice(choices: Sequence, default=None):
    if len(choices) == 0:
        return default
    return choice(choices)
