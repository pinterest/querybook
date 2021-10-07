import json
from unittest import mock
import pytest

from lib.query_analysis.samples import make_samples_query, SamplesError


@pytest.fixture
def fake_table():
    _fake_table = mock.MagicMock()
    _fake_table.name = "session_data"
    _fake_table.data_schema.name = "data"

    fake_column_dt = mock.MagicMock()
    fake_column_dt.name = "dt"
    fake_column_dt.type = "string"

    fake_column_id = mock.MagicMock()
    fake_column_id.name = "id"
    fake_column_id.type = "bigint"

    _fake_table.columns = [fake_column_dt, fake_column_id]
    _fake_table.information.to_dict.return_value = {
        "latest_partitions": json.dumps(["dt=2019-11-08", "dt=2019-11-09"])
    }
    return _fake_table


@mock.patch("lib.query_analysis.samples.get_table_by_id")
def test_basic(get_table_by_id_mock, db_engine, fake_table):
    get_table_by_id_mock.return_value = fake_table

    assert """
SELECT
    *
FROM data.session_data
WHERE
dt='2019-11-09'

LIMIT 1""" == make_samples_query(
        table_id=1234, limit=1
    )

    assert """
SELECT
    *
FROM data.session_data
WHERE
dt='2019-11-08'

LIMIT 2""" == make_samples_query(
        table_id=1234, limit=2, partition="dt=2019-11-08"
    )

    assert """
SELECT
    *
FROM data.session_data
WHERE
dt='2019-11-09'
ORDER BY id ASC
LIMIT 3""" == make_samples_query(
        table_id=1234, limit=3, order_by="id"
    )


@mock.patch("lib.query_analysis.samples.get_table_by_id")
def test_where_filter(get_table_by_id_mock, db_engine, fake_table):
    get_table_by_id_mock.return_value = fake_table
    assert """
SELECT
    *
FROM data.session_data
WHERE
dt='2019-11-09' AND id = 5

LIMIT 4""" == make_samples_query(
        table_id=1234, limit=4, where=[["id", "=", "5"]]
    )

    assert """
SELECT
    *
FROM data.session_data
WHERE
dt='2019-11-09' AND id = 5 AND id IS NOT NULL

LIMIT 4""" == make_samples_query(
        table_id=1234, limit=4, where=[["id", "=", "5"], ["id", "IS NOT NULL", ""]]
    )


@mock.patch("lib.query_analysis.samples.get_table_by_id")
def test_exception(get_table_by_id_mock, db_engine, fake_table):
    get_table_by_id_mock.return_value = fake_table

    # Invalid order by column
    with pytest.raises(SamplesError):
        make_samples_query(table_id=1234, limit=1001, order_by="employee_id")

    # Invalid partition
    with pytest.raises(SamplesError):
        make_samples_query(table_id=1234, limit=1001, partition="dt=1000-01-01")

    # Invalid filter column
    with pytest.raises(SamplesError):
        make_samples_query(table_id=1234, limit=1001, where=[["employee_id", "=", "5"]])
    # Invalid filter op
    with pytest.raises(SamplesError):
        make_samples_query(table_id=1234, limit=1001, where=[["id", "==", "5"]])
    # Invalid filter value
    with pytest.raises(AttributeError):
        make_samples_query(table_id=1234, limit=1001, where=[["id", "=", 5]])
