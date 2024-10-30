import yaml
import re
from typing import List
from models.datadoc import DataDoc, DataCell
from const.data_doc import DataCellType
from datetime import datetime, timezone


def parse_datetime_as_utc(date_str: str) -> datetime:
    """
    Parse the given date string to a datetime object in UTC.
    """
    if isinstance(date_str, datetime):
        return date_str.astimezone(timezone.utc)
    if date_str:
        return datetime.fromisoformat(date_str).astimezone(timezone.utc)
    return datetime.now(timezone.utc).replace(tzinfo=timezone.utc)


def serialize_datadoc_to_markdown(datadoc: DataDoc) -> str:
    # Serialize DataDoc metadata to YAML front matter for readability
    datadoc_metadata = {
        "id": datadoc.id,
        "environment_id": datadoc.environment_id,
        "public": datadoc.public,
        "archived": datadoc.archived,
        "owner_uid": datadoc.owner_uid,
        "created_at": datadoc.created_at.isoformat() if datadoc.created_at else None,
        "updated_at": datadoc.updated_at.isoformat() if datadoc.updated_at else None,
        "meta": datadoc.meta,
        "title": datadoc.title,
    }
    try:
        front_matter = (
            f"---\n{yaml.dump(datadoc_metadata, default_flow_style=False)}---\n\n"
        )
    except yaml.YAMLError as e:
        raise ValueError(f"Error serializing DataDoc metadata to YAML: {e}")

    title = f"# {datadoc.title}\n\n"
    content = serialize_datacells(datadoc.cells)
    markdown_content = front_matter + title + content
    return markdown_content


def serialize_datacells(cells: List[DataCell]) -> str:
    lines = []
    for cell in cells:
        # Since GitHub's Markdown renderer does not recognize multiple --- blocks as separate YAML sections,
        # we serialize cell metadata in HTML comment to hide it from rendered view
        cell_metadata = {
            "id": cell.id,
            "cell_type": cell.cell_type.name.lower(),
            "created_at": cell.created_at.isoformat() if cell.created_at else None,
            "updated_at": cell.updated_at.isoformat() if cell.updated_at else None,
            "meta": cell.meta,
        }
        try:
            cell_metadata_yaml = yaml.dump(cell_metadata, default_flow_style=False)
        except yaml.YAMLError as e:
            raise ValueError(f"Error serializing cell metadata to YAML: {e}")

        cell_metadata_comment = f"<!--\n{cell_metadata_yaml.strip()}\n-->\n"

        cell_content = serialize_cell_content(cell)
        lines.append(cell_metadata_comment + cell_content)

    return "\n\n".join(lines)


def serialize_cell_content(cell: DataCell) -> str:
    cell_meta = cell.meta or {}
    if cell.cell_type == DataCellType.query:
        query_title = cell_meta.get("title", "Query")
        return f"## Query: {query_title}\n\n```sql\n{cell.context.strip()}\n```\n"
    elif cell.cell_type == DataCellType.text:
        return f"## Text\n\n```text\n{cell.context.strip()}\n```\n"
    elif cell.cell_type == DataCellType.chart:
        return "## Chart\n\n```text\n*Chart generated from the metadata.*\n```\n"


def deserialize_datadoc_from_markdown(markdown_str: str) -> DataDoc:
    front_matter, content = extract_front_matter(markdown_str)
    datadoc = create_datadoc_from_metadata(front_matter)
    datadoc.cells = deserialize_datadoc_content(content)
    return datadoc


def extract_front_matter(markdown_str: str):
    front_matter_pattern = re.compile(r"^---\n(.*?)\n---\n\n", re.DOTALL)
    match = front_matter_pattern.match(markdown_str)
    if match:
        front_matter_str = match.group(1)
        content = markdown_str[match.end() :]
        try:
            front_matter = yaml.safe_load(front_matter_str)
        except yaml.YAMLError as e:
            raise ValueError(f"Error parsing front matter YAML: {e}")
    else:
        raise ValueError("Invalid Markdown format: Missing front matter.")
    return front_matter, content


def create_datadoc_from_metadata(metadata: dict) -> DataDoc:
    datadoc = DataDoc(
        id=metadata.get("id"),
        environment_id=metadata.get("environment_id"),
        public=metadata.get("public", True),
        archived=metadata.get("archived", False),
        owner_uid=metadata.get("owner_uid"),
        created_at=parse_datetime_as_utc(metadata.get("created_at")),
        updated_at=parse_datetime_as_utc(metadata.get("updated_at")),
        title=metadata.get("title", ""),
    )
    datadoc.meta = metadata.get("meta", {})
    return datadoc


def deserialize_datadoc_content(content_str: str) -> List[DataCell]:
    cells = []
    # Pattern to match cell metadata in HTML comments and the following content
    pattern = re.compile(r"<!--\n(.*?)\n-->\n## .*?\n\n```.*?\n(.*?)\n```", re.DOTALL)
    matches = pattern.finditer(content_str)
    for match in matches:
        metadata_str = match.group(1)
        cell_content = match.group(2)
        try:
            metadata = yaml.safe_load(metadata_str)
        except yaml.YAMLError as e:
            raise ValueError(f"Error parsing cell metadata YAML: {e}")

        cell_type_str = metadata.get("cell_type", "query").lower()
        cell_type = DataCellType[cell_type_str]
        cell = DataCell(
            id=metadata.get("id"),
            cell_type=cell_type,
            context=(
                cell_content.strip() if cell_type != DataCellType.chart else None
            ),  # Charts are generated from the metadata, and not from content
            created_at=parse_datetime_as_utc(metadata.get("created_at")),
            updated_at=parse_datetime_as_utc(metadata.get("updated_at")),
            meta=metadata.get("meta", {}),
        )
        cells.append(cell)
    return cells
