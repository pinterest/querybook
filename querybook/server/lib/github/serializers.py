import yaml
import re
from typing import List, Tuple, Optional
from models.datadoc import DataDoc, DataCell
from const.data_doc import DataCellType
from datetime import datetime, timezone


def parse_datetime_as_utc(date_str: Optional[str]) -> datetime:
    """
    Parse the given date string to a datetime object in UTC.
    """
    if isinstance(date_str, datetime):
        return date_str.astimezone(timezone.utc)
    if date_str:
        return datetime.fromisoformat(date_str).astimezone(timezone.utc)
    return datetime.now(timezone.utc).replace(tzinfo=timezone.utc)


def serialize_datadoc_to_markdown(
    datadoc: DataDoc, exclude_metadata: bool = False
) -> str:
    """
    Serialize a DataDoc instance to a Markdown string with YAML front matter.
    """
    markdown_parts = []

    if not exclude_metadata:
        datadoc_metadata = {
            "id": datadoc.id,
            "environment_id": datadoc.environment_id,
            "public": datadoc.public,
            "archived": datadoc.archived,
            "owner_uid": datadoc.owner_uid,
            "created_at": (
                datadoc.created_at.isoformat() if datadoc.created_at else None
            ),
            "updated_at": (
                datadoc.updated_at.isoformat() if datadoc.updated_at else None
            ),
            "meta": datadoc.meta,
            "title": datadoc.title,
        }
        try:
            front_matter = (
                f"---\n{yaml.dump(datadoc_metadata, default_flow_style=False)}---\n\n"
            )
            markdown_parts.append(front_matter)

        except yaml.YAMLError as e:
            raise ValueError(f"Error serializing DataDoc metadata to YAML: {e}")

    title = f"# {datadoc.title}\n\n"
    markdown_parts.append(title)

    content = serialize_datacells(
        cells=datadoc.cells, exclude_metadata=exclude_metadata
    )
    markdown_parts.append(content)

    return "".join(markdown_parts)


def serialize_datacells(cells: List[DataCell], exclude_metadata: bool = False) -> str:
    """
    Serialize a list of DataCell instances to a Markdown string.
    """
    cell_strings = []
    for cell in cells:
        cell_content = serialize_cell_content(
            cell=cell, exclude_metadata=exclude_metadata
        )

        if not exclude_metadata:
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
            cell_strings.append(cell_metadata_comment + cell_content)
        else:
            cell_strings.append(cell_content)

    return "\n\n".join(cell_strings)


def serialize_cell_content(cell: DataCell, exclude_metadata: bool = False) -> str:
    """
    Serialize a single DataCell instance to a Markdown string based on its type
    """
    cell_meta = cell.meta or {}

    if cell.cell_type == DataCellType.query:
        query_title = cell_meta.get("title") or "Query"
        header = f"## Query: {query_title}\n\n"
        if exclude_metadata:  # Exclude code fences
            content = f"{cell.context.strip()}\n"
        else:
            content = f"```sql\n{cell.context.strip()}\n```\n"
        return header + content

    elif cell.cell_type == DataCellType.text:
        header = "## Text\n\n"
        content = f"{cell.context.strip()}\n"
        return header + content

    elif cell.cell_type == DataCellType.chart:
        header = "## Chart\n\n"
        content = "*Chart generated from the metadata.*\n"
        return header + content

    else:
        raise ValueError(f"Unknown cell type: {cell.cell_type}")


def deserialize_datadoc_from_markdown(markdown_str: str) -> DataDoc:
    """
    Deserialize a Markdown string to a DataDoc instance.
    """
    front_matter, content = extract_front_matter(markdown_str)
    datadoc = create_datadoc_from_metadata(front_matter)
    datadoc.cells = deserialize_datadoc_content(content)
    return datadoc


def extract_front_matter(markdown_str: str) -> Tuple[dict, str]:
    """
    Extract YAML front matter and the remaining content from the markdown string.
    """
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
    """
    Create a DataDoc instance from metadata dictionary.
    """
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
    """
    Deserialize the content part of the markdown into a list of DataCell instances.
    Handles Query, Text, and Chart cell types.
    """
    cells = []
    # Split the content by the HTML comment markers. Each cell starts with <!--\nmetadata\n-->
    cell_blocks = re.split(r"<!--\n.*?\n-->\n", content_str, flags=re.DOTALL)

    # The first split item is the title, skip it
    cell_blocks = cell_blocks[1:]

    metadata_blocks = re.findall(r"<!--\n(.*?)\n-->", content_str, flags=re.DOTALL)

    if len(cell_blocks) != len(metadata_blocks):
        raise ValueError("Mismatch between metadata and cell content blocks.")

    for metadata_str, cell_content in zip(metadata_blocks, cell_blocks):
        try:
            metadata = yaml.safe_load(metadata_str)
        except yaml.YAMLError as e:
            raise ValueError(f"Error parsing cell metadata YAML: {e}")

        cell_type = metadata.get("cell_type", "").lower()
        try:
            cell_type_enum = DataCellType[cell_type]
        except KeyError:
            raise ValueError(f"Unknown cell_type: {cell_type}")

        # Determine the cell content based on cell type
        if cell_type_enum == DataCellType.query:
            # Extract the SQL code block
            sql_pattern = re.compile(
                r"## Query: [^\n]+\n\n```sql\n([\s\S]*?)\n```", re.DOTALL
            )
            match = sql_pattern.search(cell_content)
            if not match:
                raise ValueError("Query cell missing SQL code block.")
            context = match.group(1).strip()
        elif cell_type_enum == DataCellType.text:
            # Extract text content
            text_pattern = re.compile(r"## Text\n\n([\s\S]+)", re.DOTALL)
            match = text_pattern.search(cell_content)
            if not match:
                raise ValueError("Text cell missing content.")
            context = match.group(1).strip()
        elif cell_type_enum == DataCellType.chart:
            # Chart cells have no context since they're created via metadata
            context = None
        else:
            raise ValueError(f"Unsupported cell type: {cell_type_enum}")

        cell = DataCell(
            id=metadata.get("id"),
            cell_type=cell_type_enum,
            context=context if cell_type_enum != DataCellType.chart else "",
            created_at=parse_datetime_as_utc(metadata.get("created_at")),
            updated_at=parse_datetime_as_utc(metadata.get("updated_at")),
            meta=metadata.get("meta", {}),
        )
        cells.append(cell)

    return cells
