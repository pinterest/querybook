import json
from unittest import mock
from lib.query_analysis.samples import make_samples_query


@mock.patch("lib.query_analysis.samples.get_table_by_id")
def test_basic(get_table_by_id_mock, db_engine):

    fake_table = mock.MagicMock()
    fake_table.name = "session_data"
    fake_table.data_schema.name = "data"
    fake_table.information.to_dict.return_value = {
        "latest_partitions": json.dumps(["dt=2019-11-08", "dt=2019-11-09"])
    }
    get_table_by_id_mock.return_value = fake_table

    query = make_samples_query(table_id=1234, limit=1001)
    assert (
        """
select
    *
from data.session_data
WHERE
dt='2019-11-09'
limit 1001"""
        == query
    )
