from lib.scheduled_datadoc.legacy import convert_if_legacy_datadoc_schedule

unchanged_fields = {
    "doc_id": 1,
    "user_id": 1,
    "notify_with": "email",
}

legacy_config = {
    **unchanged_fields,
    "exporter_cell_id": 1,
    "exporter_name": "foobar",
    "exporter_params": {},
}


current_config = {
    **unchanged_fields,
    "exports": [
        {"exporter_cell_id": 1, "exporter_name": "foobar", "exporter_params": {}}
    ],
}


def test_convert_current():
    assert convert_if_legacy_datadoc_schedule(current_config) == current_config


def test_convert_legacy():
    assert convert_if_legacy_datadoc_schedule(legacy_config) == current_config


def test_convert_semi_legacy():
    assert convert_if_legacy_datadoc_schedule(
        {
            **unchanged_fields,
            "exporter_name": "foobar",
            "exporter_params": {},
        }
    ) == {**unchanged_fields, "exports": []}


def test_convert_unchanged():
    assert convert_if_legacy_datadoc_schedule(unchanged_fields) == unchanged_fields
