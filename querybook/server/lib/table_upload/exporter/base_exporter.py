from abc import ABC, abstractmethod

from typing import Dict, Optional

from app.db import with_session
from lib.table_upload.importer.base_importer import BaseTableUploadImporter
from logic.admin import get_query_engine_by_id
from lib.metastore import get_metastore_loader


class BaseTableUploadExporter(ABC):
    def __init__(
        self,
        uid: int,
        engine_id: int,
        importer: BaseTableUploadImporter,
        table_config: Dict,
    ):
        self._uid = uid
        self._engine_id = engine_id
        self._importer = importer
        self._table_config = table_config

    @abstractmethod
    def _upload(self):
        """Perform the upload action. Override this method to
        provide upload behavior

        No return value is expected, if the upload fails an exception
        must be thrown
        """
        raise NotImplementedError()

    @property
    def _fq_table_name(self):
        return self._table_config["schema_name"], self._table_config["table_name"]

    @with_session
    def _get_metastore_loader(self, session=None):
        engine = get_query_engine_by_id(self._engine_id, session=session)
        metastore_id = engine.metastore_id
        if metastore_id is None:
            return None

        loader = get_metastore_loader(metastore_id, session=session)
        return loader

    @with_session
    def _sync_table_from_metastore(self, session=None) -> Optional[int]:
        loader = self._get_metastore_loader(session=session)
        if loader:
            schema_name, table_name = self._fq_table_name
            return loader.sync_create_or_update_table(
                schema_name, table_name, session=session
            )
        return None

    @with_session
    def _check_if_table_exists(self, session=None) -> Optional[bool]:
        loader = self._get_metastore_loader(session=session)
        if loader:
            schema_name, table_name = self._fq_table_name
            return loader.check_if_table_exists(schema_name, table_name)
        return False

    def upload(self) -> Optional[int]:
        self._upload()
        return self._sync_table_from_metastore()
