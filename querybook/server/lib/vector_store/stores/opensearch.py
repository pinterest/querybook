from langchain.vectorstores import OpenSearchVectorSearch
from lib.vector_store.base_vector_store import VectorStoreBase


class OpenSearchVectorStore(OpenSearchVectorSearch, VectorStoreBase):
    def delete_doc_by_id(self, doc_id: str):
        self.client.delete(index=self.index_name, id=doc_id)
