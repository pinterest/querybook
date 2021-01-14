from unittest import mock
from const.query_execution import QueryExecutionStatus
from lib.scheduled_datadoc.export import (
    group_export_by_cell_id,
    _export_query_cell,
)


def test_group_export_by_cell_id():
    assert group_export_by_cell_id(
        [
            {"exporter_cell_id": 1, "exporter_name": "foo"},
            {"exporter_cell_id": 1, "exporter_name": "bar"},
            {"exporter_cell_id": 2, "exporter_name": "foo"},
        ]
    ) == {
        1: [
            {"exporter_cell_id": 1, "exporter_name": "foo"},
            {"exporter_cell_id": 1, "exporter_name": "bar"},
        ],
        2: [{"exporter_cell_id": 2, "exporter_name": "foo"}],
    }


@mock.patch("lib.scheduled_datadoc.export.get_last_query_execution_from_cell")
@mock.patch("lib.scheduled_datadoc.export.get_exporter")
def test_export_query_cell(mock_get_exporter, mock_get_execution):
    mock_execution = mock.MagicMock()
    mock_execution.status = QueryExecutionStatus.DONE
    mock_get_execution.return_value = mock_execution

    mock_exporter = mock.MagicMock()
    mock_exporter.export.return_value = "foobar.baz"
    mock_get_exporter.return_value = mock_exporter

    assert _export_query_cell(
        cell=mock.MagicMock(),
        uid=1,
        cell_exports=[
            {"exporter_cell_id": 1, "exporter_name": "foo"},
            {"exporter_cell_id": 1, "exporter_name": "bar"},
        ],
        session=mock.MagicMock(),
    ) == ["foobar.baz", "foobar.baz"]
