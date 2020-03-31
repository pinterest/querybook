from datetime import datetime, timedelta
from typing import Dict

import pystache


def get_default_variables():
    return {
        "today": datetime.today().strftime("%Y-%m-%d"),
        "yesterday": (datetime.today() - timedelta(1)).strftime("%Y-%m-%d"),
    }


def render_templated_query(query: str, templated_vars: Dict[str, str]) -> str:
    filtered_templated_vars = {}
    for key, value in templated_vars.items():
        if value:
            filtered_templated_vars[key] = value

    all_variables = {**get_default_variables(), **filtered_templated_vars}

    renderer = pystache.Renderer(escape=lambda u: u)
    return renderer.render(query, all_variables)
