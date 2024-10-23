import yaml
import re
from typing import List
from models.datadoc import DataDoc, DataCell
from const.data_doc import DataCellType


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
    front_matter = (
        f"---\n{yaml.dump(datadoc_metadata, default_flow_style=False)}---\n\n"
    )

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
        cell_metadata_yaml = yaml.dump(cell_metadata, default_flow_style=False)
        cell_metadata_comment = f"<!--\n{cell_metadata_yaml.strip()}\n-->\n"

        cell_content = serialize_cell_content(cell)
        lines.append(cell_metadata_comment + cell_content)

    return "\n\n".join(lines)


def serialize_cell_content(cell: DataCell) -> str:
    if cell.cell_type == DataCellType.query:
        query_title = cell.meta.get("title", "Query")
        return f"## Query: {query_title}\n\n```sql\n{cell.context.strip()}\n```\n"
    elif cell.cell_type == DataCellType.text:
        return f"{cell.context.strip()}\n"
    elif cell.cell_type == DataCellType.chart:
        return "## Chart\n\n*Chart generated from the metadata.*\n"


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
        front_matter = yaml.safe_load(front_matter_str)
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
        created_at=metadata.get("created_at"),
        updated_at=metadata.get("updated_at"),
        title=metadata.get("title", ""),
    )
    datadoc.meta = metadata.get("meta", {})
    return datadoc


def deserialize_datadoc_content(content_str: str) -> List[DataCell]:
    cells = []
    # Pattern to match cell metadata in HTML comments and the following content
    pattern = re.compile(r"<!--\n(.*?)\n-->\n(.*?)(?=(\n\n<!--\n|$))", re.DOTALL)

    matches = pattern.finditer(content_str)
    for match in matches:
        metadata_str = match.group(1)
        cell_content = match.group(2)
        metadata = yaml.safe_load(metadata_str)
        cell_type_str = metadata.get("cell_type", "markdown").lower()
        cell_type = DataCellType[cell_type_str]
        cell = DataCell(
            id=metadata.get("id"),
            cell_type=cell_type,
            context=cell_content.strip(),
            created_at=metadata.get("created_at"),
            updated_at=metadata.get("updated_at"),
            meta=metadata.get("meta", {}),
        )
        cells.append(cell)

    return cells
