import pytest
from const.data_doc import DataCellType
from lib.github.serializers import (
    serialize_datadoc_to_markdown,
    deserialize_datadoc_from_markdown,
)
from models.datadoc import DataCell, DataDoc
from datetime import datetime, timezone


@pytest.fixture
def mock_datadoc():
    cells = [
        DataCell(
            id=1,
            cell_type=DataCellType.query,
            context="SELECT * FROM table;",
            created_at=datetime(2023, 1, 1, 0, 0, 0, tzinfo=timezone.utc),
            updated_at=datetime(2023, 1, 1, 0, 0, 0, tzinfo=timezone.utc),
            meta={"title": "Sample Query"},
        ),
        DataCell(
            id=2,
            cell_type=DataCellType.text,
            context="<p>This is a text cell with <strong>HTML</strong> content.</p>",
            created_at=datetime(2023, 1, 1, 0, 0, 0, tzinfo=timezone.utc),
            updated_at=datetime(2023, 1, 1, 0, 0, 0, tzinfo=timezone.utc),
            meta={},
        ),
        DataCell(
            id=3,
            cell_type=DataCellType.chart,
            context=None,  # Context is None for chart cells
            created_at=datetime(2023, 1, 1, 0, 0, 0, tzinfo=timezone.utc),
            updated_at=datetime(2023, 1, 1, 0, 0, 0, tzinfo=timezone.utc),
            meta={"chart_type": "line"},
        ),
    ]
    datadoc = DataDoc(
        id=1,
        environment_id=1,
        public=True,
        archived=False,
        owner_uid="user1",
        created_at=datetime(2023, 1, 1, 0, 0, 0, tzinfo=timezone.utc),
        updated_at=datetime(2023, 1, 1, 0, 0, 0, tzinfo=timezone.utc),
        title="Test DataDoc",
        cells=cells,
    )
    datadoc.meta = {"variables": []}
    return datadoc


def test_serialize_datadoc_to_markdown(mock_datadoc):
    expected_markdown = (
        "---\n"
        "archived: false\n"
        "created_at: '2023-01-01T00:00:00+00:00'\n"
        "environment_id: 1\n"
        "id: 1\n"
        "meta:\n"
        "  variables: []\n"
        "owner_uid: user1\n"
        "public: true\n"
        "title: Test DataDoc\n"
        "updated_at: '2023-01-01T00:00:00+00:00'\n"
        "---\n\n"
        "# Test DataDoc\n\n"
        "<!--\n"
        "cell_type: query\n"
        "created_at: '2023-01-01T00:00:00+00:00'\n"
        "id: 1\n"
        "meta:\n"
        "  title: Sample Query\n"
        "updated_at: '2023-01-01T00:00:00+00:00'\n"
        "-->\n"
        "## Query: Sample Query\n\n"
        "```sql\nSELECT * FROM table;\n```\n\n"
        "<!--\n"
        "cell_type: text\n"
        "created_at: '2023-01-01T00:00:00+00:00'\n"
        "id: 2\n"
        "meta: {}\n"
        "updated_at: '2023-01-01T00:00:00+00:00'\n"
        "-->\n"
        "## Text\n\n"
        "<p>This is a text cell with <strong>HTML</strong> content.</p>\n\n"
        "<!--\n"
        "cell_type: chart\n"
        "created_at: '2023-01-01T00:00:00+00:00'\n"
        "id: 3\n"
        "meta:\n"
        "  chart_type: line\n"
        "updated_at: '2023-01-01T00:00:00+00:00'\n"
        "-->\n"
        "## Chart\n\n"
        "*Chart generated from the metadata.*\n"
    )

    serialized = serialize_datadoc_to_markdown(mock_datadoc)

    # Normalize line endings and strip trailing spaces for comparison
    # Preserve line breaks by joining with '\n'
    serialized = "".join([line.rstrip() for line in serialized.strip().splitlines()])
    expected_markdown = "".join(
        [line.rstrip() for line in expected_markdown.strip().splitlines()]
    )
    assert serialized == expected_markdown


def test_deserialize_datadoc_from_markdown(mock_datadoc):
    markdown_str = serialize_datadoc_to_markdown(mock_datadoc)
    deserialized_datadoc = deserialize_datadoc_from_markdown(markdown_str)
    assert deserialized_datadoc.to_dict(with_cells=True) == mock_datadoc.to_dict(
        with_cells=True
    )


def test_deserialize_with_inner_code_blocks():
    """
    Test deserialization where text/query content contains user written ``` backticks that may interfere with deserialization process.
    """
    markdown_str = (
        "---\n"
        "archived: false\n"
        "created_at: '2023-01-01T00:00:00+00:00'\n"
        "environment_id: 1\n"
        "id: 2\n"
        "meta:\n"
        "  variables: []\n"
        "owner_uid: user1\n"
        "public: true\n"
        "title: Document with Code Blocks\n"
        "updated_at: '2023-01-01T00:00:00+00:00'\n"
        "---\n\n"
        "# Document with Code Blocks\n\n"
        "<!--\n"
        "cell_type: text\n"
        "created_at: '2023-01-01T00:00:00+00:00'\n"
        "id: 2\n"
        "meta: {}\n"
        "updated_at: '2023-01-01T00:00:00+00:00'\n"
        "-->\n"
        "## Text\n\n"
        "Here is some text with a code block:\n"
        "```python\nprint('Hello, World!')\n```\n\n"
    )

    deserialized = deserialize_datadoc_from_markdown(markdown_str)
    expected_datadoc = DataDoc(
        id=2,
        environment_id=1,
        public=True,
        archived=False,
        owner_uid="user1",
        created_at=datetime(2023, 1, 1, tzinfo=timezone.utc),
        updated_at=datetime(2023, 1, 1, tzinfo=timezone.utc),
        title="Document with Code Blocks",
        cells=[
            DataCell(
                id=2,
                cell_type=DataCellType.text,
                context="Here is some text with a code block:\n```python\nprint('Hello, World!')\n```",
                created_at=datetime(2023, 1, 1, tzinfo=timezone.utc),
                updated_at=datetime(2023, 1, 1, tzinfo=timezone.utc),
                meta={},
            )
        ],
    )
    expected_datadoc.meta = {"variables": []}

    assert deserialized.to_dict(with_cells=True) == expected_datadoc.to_dict(
        with_cells=True
    )
