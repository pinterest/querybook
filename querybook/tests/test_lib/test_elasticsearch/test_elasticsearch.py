import datetime
from unittest import TestCase
from unittest.mock import MagicMock, patch
from const.data_doc import DataCellType

from logic.elasticsearch import (
    datadocs_to_es,
    query_cell_to_es,
    query_execution_to_es,
    table_to_es,
    user_to_es,
)

CREATED_AT_DT = datetime.datetime(2020, 5, 5, 12, 8, 30)
CREATED_AT_EPOCH = 1588680510
COMPLETED_AT_DT = datetime.datetime(
    2020, 5, 5, 12, 8, 45
)  # 15 seconds after created at


class QueryTestCaseMixin(TestCase):
    QUERY_TEXT = "SELECT id, val1 from test_table inner join test_table_2 on test_table_2.val1 = test_table_1.val1 limit 10;"
    ENGINE_ID = 7
    AUTHOR_UID = "bob"
    ENVIRONMENT_ID = 2

    QUERY_CELL_ID = 32
    QUERY_CELL_TITLE = "Test Query Cell"
    DATADOC_ID = 198

    BASE_EXPECTED_RESULT = {
        "title": QUERY_CELL_TITLE,
        "author_uid": AUTHOR_UID,
        "engine_id": ENGINE_ID,
        "statement_type": ["SELECT"],
        "created_at": CREATED_AT_EPOCH,
        "full_table_name": ["main.test_table", "main.test_table_2"],
        "query_text": QUERY_TEXT,
    }

    def _patch_get_query_engine_by_id(self):
        get_query_engine_by_id_patch = patch("logic.admin.get_query_engine_by_id")
        self.get_query_engine_by_id_mock = get_query_engine_by_id_patch.start()
        self.addCleanup(get_query_engine_by_id_patch.stop)
        self.get_query_engine_by_id_mock.return_value = MagicMock(
            id=self.ENGINE_ID,
            language="sqlite",
            environments=[MagicMock(id=self.ENVIRONMENT_ID)],
        )

    def _patch_get_datadoc_editors_by_doc_id(self):
        get_data_doc_editors_by_doc_id_patch = patch(
            "logic.datadoc.get_data_doc_editors_by_doc_id"
        )
        self.get_data_doc_editors_by_doc_id_mock = (
            get_data_doc_editors_by_doc_id_patch.start()
        )
        self.addCleanup(get_data_doc_editors_by_doc_id_patch.stop)

    def _create_private_shared_datadoc_mock(self):
        mock_doc = MagicMock(
            id=self.DATADOC_ID,
            environment_id=self.ENVIRONMENT_ID,
            owner_uid=self.AUTHOR_UID,
            public=False,
        )
        self.get_data_doc_editors_by_doc_id_mock.return_value = [
            MagicMock(uid="alice"),
            MagicMock(uid="charlie"),
        ]
        return mock_doc

    def _create_private_datadoc_mock(self):
        mock_doc = MagicMock(
            id=self.DATADOC_ID,
            environment_id=self.ENVIRONMENT_ID,
            owner_uid=self.AUTHOR_UID,
            public=False,
        )
        self.get_data_doc_editors_by_doc_id_mock.return_value = []
        return mock_doc

    def _create_public_datadoc_mock(self):
        mock_doc = MagicMock(
            id=self.DATADOC_ID,
            environment_id=self.ENVIRONMENT_ID,
            owner_uid=self.AUTHOR_UID,
            public=True,
        )
        return mock_doc

    def _get_mock_query_cell(self):
        return MagicMock(
            id=self.QUERY_CELL_ID,
            context=self.QUERY_TEXT,
            created_at=CREATED_AT_DT,
            doc=self._create_private_shared_datadoc_mock(),
            meta={
                "engine": self.ENGINE_ID,
                "title": self.QUERY_CELL_TITLE,
            },
        )

    def _assert_equals_query_item(self, result, expected_result):
        for key, expected_value in expected_result.items():
            if key != "full_table_name":
                self.assertEqual(result[key], expected_value)
            else:  # full_table_name array order can change
                self.assertEqual(set(result[key]), set(expected_value))

        self.assertEqual(len(result.items()), len(expected_result.items()))

    def setUp(self):
        self._patch_get_query_engine_by_id()
        self._patch_get_datadoc_editors_by_doc_id()


class QueryCellTestCase(QueryTestCaseMixin):
    def setUp(self):
        super(QueryCellTestCase, self).setUp()
        self.mock_cell = self._get_mock_query_cell()
        self.BASE_EXPECTED_RESULT = {
            **self.BASE_EXPECTED_RESULT,
            "id": self.QUERY_CELL_ID,
            "query_type": "query_cell",
            "data_doc_id": self.DATADOC_ID,
            "environment_id": self.ENVIRONMENT_ID,
        }

    def test_query_cell_to_es(self):
        result = query_cell_to_es(self.mock_cell, session=MagicMock())
        expected_result = {
            **self.BASE_EXPECTED_RESULT,
            "public": False,
            "readable_user_ids": ["alice", "charlie"],
        }
        self._assert_equals_query_item(result, expected_result)

    def test_private_datadoc(self):
        self.mock_cell.doc = self._create_private_datadoc_mock()
        expected_result = {
            **self.BASE_EXPECTED_RESULT,
            "public": False,
            "readable_user_ids": [],
        }
        result = query_cell_to_es(self.mock_cell, session=MagicMock())
        self._assert_equals_query_item(result, expected_result)

    def test_public_datadoc(self):
        self.mock_cell.doc = self._create_public_datadoc_mock()
        expected_result = {
            **self.BASE_EXPECTED_RESULT,
            "public": True,
            "readable_user_ids": [],
        }
        result = query_cell_to_es(self.mock_cell, session=MagicMock())
        self._assert_equals_query_item(result, expected_result)

    def test_partial_dict(self):
        # Test that heavy process_query function isn't run when we select specific dict fields
        with patch("lib.query_analysis.lineage.process_query") as mock_process_query:
            result = query_cell_to_es(
                self.mock_cell,
                fields=["id", "query_type", "statement_type"],
                session=MagicMock(),
            )
            self.assertEqual(
                result,
                {
                    "id": self.QUERY_CELL_ID,
                    "query_type": "query_cell",
                    "statement_type": ["SELECT"],
                },
            )
            self.assertEqual(mock_process_query.call_count, 0)


class QueryExecutionTestCase(QueryTestCaseMixin):
    EXECUTION_ID = 2837
    QUERY_DURATION = 15  # COMPLETED_AT_DT - CREATED_AT_DT seconds

    def setUp(self):
        super(QueryExecutionTestCase, self).setUp()

        # mock query_execution
        self.mock_execution = MagicMock(
            id=self.EXECUTION_ID,
            uid=self.AUTHOR_UID,
            engine_id=self.ENGINE_ID,
            query=self.QUERY_TEXT,
            created_at=CREATED_AT_DT,
            completed_at=COMPLETED_AT_DT,
        )
        self.BASE_EXPECTED_RESULT = {
            **self.BASE_EXPECTED_RESULT,
            "id": self.EXECUTION_ID,
            "query_type": "query_execution",
            "environment_id": [self.ENVIRONMENT_ID],
            "duration": self.QUERY_DURATION,
        }

    def test_no_data_cell(self):
        result = query_execution_to_es(self.mock_execution, session=MagicMock())
        expected_result = {
            **self.BASE_EXPECTED_RESULT,
            "title": None,
            "public": True,
            "readable_user_ids": [],
        }
        self._assert_equals_query_item(result, expected_result)

    def test_with_data_cell(self):
        mock_cell = self._get_mock_query_cell()
        expected_result = {
            **self.BASE_EXPECTED_RESULT,
            "public": False,
            "readable_user_ids": ["alice", "charlie"],
        }
        result = query_execution_to_es(
            self.mock_execution, data_cell=mock_cell, session=MagicMock()
        )
        self._assert_equals_query_item(result, expected_result)

    def test_partial_dict(self):
        # Test that heavy process_query function isn't run when we select specific dict fields
        with patch("lib.query_analysis.lineage.process_query") as mock_process_query:
            result = query_execution_to_es(
                self.mock_execution,
                fields=["id", "query_type", "readable_user_ids"],
                session=MagicMock(),
            )
            self.assertEqual(
                result,
                {
                    "id": self.EXECUTION_ID,
                    "query_type": "query_execution",
                    "readable_user_ids": [],
                },
            )
            self.assertEqual(mock_process_query.call_count, 0)


class DataDocTestCase(TestCase):
    DATADOC_ID = 112
    ENVIRONMENT_ID = 7
    OWNER_UID = "bob"
    DATADOC_TITLE = "Test DataDoc"

    def _get_datadoc_cells_mock(self):
        return [
            MagicMock(
                cell_type=DataCellType.query,
                context="SELECT * FROM table;",
                meta={"title": "test cell"},
            ),
            MagicMock(
                cell_type=DataCellType.query,
                context="SELECT * FROM table_2;",
                meta={},
            ),
            MagicMock(cell_type=DataCellType.text, context="test text"),
            MagicMock(
                cell_type=DataCellType.chart,
            ),
        ]

    def _get_datadoc_mock(self):
        mock_doc = MagicMock(
            id=self.DATADOC_ID,
            environment_id=self.ENVIRONMENT_ID,
            owner_uid=self.OWNER_UID,
            created_at=CREATED_AT_DT,
            title=self.DATADOC_TITLE,
            public=False,
            cells=self._get_datadoc_cells_mock(),
        )
        return mock_doc

    def _patch_get_data_doc_editors_by_doc_id(self):
        get_data_doc_editors_by_doc_id_patch = patch(
            "logic.datadoc.get_data_doc_editors_by_doc_id"
        )
        self.get_data_doc_editors_by_doc_id_mock = (
            get_data_doc_editors_by_doc_id_patch.start()
        )
        self.addCleanup(get_data_doc_editors_by_doc_id_patch.stop)
        self.get_data_doc_editors_by_doc_id_mock.return_value = [
            MagicMock(uid="alice"),
            MagicMock(uid="charlie"),
        ]

    def setUp(self):
        self.mock_doc = self._get_datadoc_mock()
        self._patch_get_data_doc_editors_by_doc_id()

    def test_data_doc_to_es(self):
        result = datadocs_to_es(self.mock_doc, session=MagicMock())
        expected_result = {
            "id": self.DATADOC_ID,
            "environment_id": self.ENVIRONMENT_ID,
            "owner_uid": self.OWNER_UID,
            "created_at": CREATED_AT_EPOCH,
            "cells": "test cell\nSELECT * FROM table;\nSELECT * FROM table_2;\ntest text\n[... additional unparsable content ...]",
            "title": self.DATADOC_TITLE,
            "public": False,
            "readable_user_ids": ["alice", "charlie"],
        }
        self.assertEqual(result, expected_result)

    def test_partial_dict(self):
        with patch("logic.elasticsearch.get_joined_cells") as mock_get_joined_cells:
            result = datadocs_to_es(
                self.mock_doc,
                fields=["id", "environment_id", "created_at"],
                session=MagicMock(),
            )
            self.assertEqual(mock_get_joined_cells.call_count, 0)
            self.assertEqual(
                result,
                {
                    "id": self.DATADOC_ID,
                    "environment_id": self.ENVIRONMENT_ID,
                    "created_at": CREATED_AT_EPOCH,
                },
            )


class TableTestCase(TestCase):
    TABLE_ID = 2
    TABLE_DESCRIPTION = "this is a test table"
    TABLE_WEIGHT = 8
    TABLE_NAME = "test_table"
    SCHEMA_NAME = "test_schema"
    FULL_NAME = "test_schema.test_table"
    METASTORE_ID = 17

    def _get_data_schema_mock(self):
        mock_data_schema = MagicMock(metastore_id=self.METASTORE_ID)
        mock_data_schema.name = self.SCHEMA_NAME
        return mock_data_schema

    def _get_data_element_mock(self, name: str, description: str):
        mock_de = MagicMock()
        mock_de.name = name
        mock_de.description = description
        return mock_de

    def _get_columns_mock(self):
        mock_col_a = MagicMock()
        mock_col_a.name = "col_a"
        mock_col_a.description = "col_a_description"
        mock_col_a.data_elements = [
            self._get_data_element_mock("de_a", "de_a_description"),
            self._get_data_element_mock("de_b", "de_b_description"),
        ]
        mock_col_b = MagicMock()
        mock_col_b.name = "col_b"
        mock_col_b.description = "col_b_description"
        mock_col_b.data_elements = [
            self._get_data_element_mock("de_a", "de_a_description"),
        ]
        return [mock_col_a, mock_col_b]

    def _get_table_mock(self):
        table_mock = MagicMock(
            id=self.TABLE_ID,
            created_at=CREATED_AT_DT,
            golden=False,
            information=MagicMock(description=self.TABLE_DESCRIPTION),
            tags=[
                MagicMock(tag_name="tag_1"),
                MagicMock(tag_name="tag_2"),
            ],
        )
        table_mock.name = self.TABLE_NAME
        table_mock.data_schema = self._get_data_schema_mock()
        table_mock.columns = self._get_columns_mock()
        return table_mock

    def _patch_get_table_weight(self):
        get_table_weight_patch = patch("logic.elasticsearch.get_table_weight")
        self.get_table_weight_mock = get_table_weight_patch.start()
        self.addCleanup(get_table_weight_patch.stop)
        self.get_table_weight_mock.return_value = self.TABLE_WEIGHT

    def setUp(self):
        self.table_mock = self._get_table_mock()
        self._patch_get_table_weight()

    def test_table_to_es(self):
        expected_result = {
            "id": self.TABLE_ID,
            "metastore_id": self.METASTORE_ID,
            "schema": self.SCHEMA_NAME,
            "name": self.TABLE_NAME,
            "full_name": self.FULL_NAME,
            "full_name_ngram": self.FULL_NAME,
            "completion_name": {
                "input": [
                    self.FULL_NAME,
                    self.TABLE_NAME,
                ],
                "weight": self.TABLE_WEIGHT,
                "contexts": {
                    "metastore_id": self.METASTORE_ID,
                },
            },
            "description": self.TABLE_DESCRIPTION,
            "created_at": CREATED_AT_EPOCH,
            "columns": ["col_a", "col_b"],
            "column_descriptions": ["col_a_description", "col_b_description"],
            "data_elements": ["de_a", "de_b"],
            "data_element_descriptions": ["de_a_description", "de_b_description"],
            "golden": False,
            "importance_score": self.TABLE_WEIGHT,
            "tags": ["tag_1", "tag_2"],
        }

        self.assertEqual(
            table_to_es(self.table_mock, session=MagicMock()),
            expected_result,
        )
        self.assertEqual(
            self.get_table_weight_mock.call_count, 1
        )  # ensure table weight isn't computed twice

    def test_partial_dict(self):
        self.assertEqual(
            table_to_es(
                self.table_mock, fields=["id", "description"], session=MagicMock()
            ),
            {
                "id": self.TABLE_ID,
                "description": self.TABLE_DESCRIPTION,
            },
        )
        self.assertEqual(self.get_table_weight_mock.call_count, 0)


class UserTestCase(TestCase):
    def setUp(self):
        self.user_mock = MagicMock(
            username="john", fullname="John Smith 123", id=7, deleted=False
        )

    def test_user_to_es(self):
        self.assertEqual(
            user_to_es(self.user_mock, session=MagicMock()),
            {
                "id": 7,
                "username": "john",
                "fullname": "John Smith 123",
                "suggest": {"input": ["john", "john", "john smith", "john", "smith"]},
            },
        )

    def test_deleted_user_to_es(self):
        self.user_mock.deleted = True
        user_dict = user_to_es(self.user_mock, session=MagicMock())

        self.assertEqual(
            user_dict["fullname"],
            "John Smith 123 (deactivated)",
        )

        # Should not impact search
        self.assertEqual(
            user_dict["suggest"],
            {"input": ["john", "john", "john smith", "john", "smith"]},
        )

    def test_partial_dict(self):
        with patch(
            "logic.elasticsearch.process_names_for_suggestion"
        ) as mock_process_names:
            self.assertEqual(
                user_to_es(
                    self.user_mock,
                    fields=["id", "username", "fullname"],
                    session=MagicMock(),
                ),
                {
                    "id": 7,
                    "username": "john",
                    "fullname": "John Smith 123",
                },
            )
            self.assertEqual(mock_process_names.call_count, 0)
