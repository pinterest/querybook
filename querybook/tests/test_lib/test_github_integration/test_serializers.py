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
            meta={},
        ),
        DataCell(
            id=2,
            cell_type=DataCellType.text,
            context="This is a text cell.",
            created_at=datetime(2023, 1, 1, 0, 0, 0, tzinfo=timezone.utc),
            updated_at=datetime(2023, 1, 1, 0, 0, 0, tzinfo=timezone.utc),
            meta={},
        ),
        DataCell(
            id=3,
            cell_type=DataCellType.chart,
            created_at=datetime(2023, 1, 1, 0, 0, 0, tzinfo=timezone.utc),
            updated_at=datetime(2023, 1, 1, 0, 0, 0, tzinfo=timezone.utc),
            meta={},
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
    datadoc.meta = {}
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
        "meta: {}\n"
        "updated_at: '2023-01-01T00:00:00+00:00'\n"
        "-->\n"
        "## Query: Query\n\n"
        "```sql\nSELECT * FROM table;\n```\n\n"
        "<!--\n"
        "cell_type: text\n"
        "created_at: '2023-01-01T00:00:00+00:00'\n"
        "id: 2\n"
        "meta: {}\n"
        "updated_at: '2023-01-01T00:00:00+00:00'\n"
        "-->\n"
        "## Text\n\n"
        "```text\nThis is a text cell.\n```\n\n"
        "<!--\n"
        "cell_type: chart\n"
        "created_at: '2023-01-01T00:00:00+00:00'\n"
        "id: 3\n"
        "meta: {}\n"
        "updated_at: '2023-01-01T00:00:00+00:00'\n"
        "-->\n"
        "## Chart\n\n"
        "```text\n*Chart generated from the metadata.*\n```\n\n"
    )

    serialized = serialize_datadoc_to_markdown(mock_datadoc)

    # Remove any extra newlines for comparison
    serialized = "\n".join([line for line in serialized.splitlines() if line.strip()])
    expected_markdown = "\n".join(
        [line for line in expected_markdown.splitlines() if line.strip()]
    )
    assert serialized == expected_markdown


def test_deserialize_datadoc_from_markdown(mock_datadoc):
    markdown_str = serialize_datadoc_to_markdown(mock_datadoc)
    deserialized = deserialize_datadoc_from_markdown(markdown_str)
    assert deserialized.to_dict(with_cells=True) == mock_datadoc.to_dict(
        with_cells=True
    )
