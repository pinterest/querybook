import re
from urllib.parse import urljoin
from bs4 import BeautifulSoup
import requests

from app.flask_app import celery
from logic.schedule import with_task_logging


def get_presto_functions_from_page(page):
    parsed_functions = []

    page = requests.get(page).content
    soup = BeautifulSoup(page, "html.parser")

    all_functions = soup.find_all("dl", "function")
    for function in all_functions:
        # function is a <dl />
        function_signature = function.find("dt")
        function_documentation = function.find("dd")

        if function_signature and function_documentation:
            function_signature_text = function_signature.get_text().strip()
            function_documentation_text = function_documentation.get_text().strip()

            signature_match = re.search(
                r"(.*)\((.*)\) \u2192 (.*)", function_signature_text
            )
            if signature_match:
                parsed_functions.append(
                    {
                        "name": signature_match.group(1).lower(),
                        "params": signature_match.group(2),
                        "return_type": signature_match.group(3),
                        "description": function_documentation_text,
                    }
                )
    return parsed_functions


def get_all_presto_functions():
    all_presto_functions = []

    functions_page_url = "https://prestodb.io/docs/current/functions.html"
    page = requests.get(functions_page_url).content
    soup = BeautifulSoup(page, "html.parser")

    sub_pages = soup.select("ul li.toctree-l1 a")
    for sub_page in sub_pages:
        # sub_page is an <a/> tag with href
        href = sub_page["href"]
        sub_page_url = urljoin(functions_page_url, href)
        all_presto_functions += get_presto_functions_from_page(sub_page_url)
    return all_presto_functions


def get_all_hive_functions():
    all_hive_functions = []

    hive_wiki_url = (
        "https://cwiki.apache.org/confluence/display/Hive/LanguageManual+UDF"
    )
    page = requests.get(hive_wiki_url).content
    soup = BeautifulSoup(page, "html.parser")

    tables = soup.select("table")

    for table in tables:
        table_headers = list(map(lambda th: th.get_text(), table.select("th")))
        is_function_table = (
            len(table_headers) == 3
            and (
                table_headers[0] == "Return Type"
                or table_headers == "Row-set columns types"
            )
            and table_headers[1] == "Name(Signature)"
            and table_headers[2] == "Description"
        )
        if not is_function_table:
            continue

        rows = table.select("tbody tr")

        for row in rows:
            tds = row.select("td")

            if len(tds) != len(table_headers):
                continue

            return_type = tds[0].get_text()
            function_signature = tds[1].get_text()
            description = tds[2].get_text()

            signature_match = re.search(r"([a-zA-Z_]+)\((.*)\)", function_signature)
            if signature_match:
                all_hive_functions.append(
                    {
                        "name": signature_match.group(1).lower(),
                        "params": signature_match.group(2),
                        "return_type": return_type,
                        "description": description,
                    }
                )

    return all_hive_functions


def main():
    from logic.datadoc import (
        truncate_function_documentation,
        create_function_documentation,
    )

    truncate_function_documentation()

    hive_functions = get_all_hive_functions()

    for hive_function in hive_functions:
        create_function_documentation(
            language="hive",
            name=hive_function["name"],
            params=hive_function["params"],
            return_type=hive_function["return_type"],
            description=hive_function["description"],
        )

    presto_functions = get_all_presto_functions()
    for presto_function in presto_functions:
        create_function_documentation(
            language="presto",
            name=presto_function["name"],
            params=presto_function["params"],
            return_type=presto_function["return_type"],
            description=presto_function["description"],
        )


if __name__ == "__main__":
    main()


@celery.task(bind=True)
@with_task_logging()
def presto_hive_function_scrapper(self, *args, **kwargs):
    main()
