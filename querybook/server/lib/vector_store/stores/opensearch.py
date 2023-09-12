from langchain.docstore.document import Document
from langchain.vectorstores import OpenSearchVectorSearch
from lib.vector_store.base_vector_store import VectorStoreBase


class OpenSearchVectorStore(OpenSearchVectorSearch, VectorStoreBase):
    def get_doc_by_id(self, doc_id: str):
        try:
            doc = self.client.get(index=self.index_name, id=doc_id)
            return Document(
                page_content=doc["_source"]["text"],
                metadata=doc["_source"]["metadata"],
            )
        except:
            # return None for not found or any error occurs
            return None

    def delete_doc_by_id(self, doc_id: str):
        self.client.delete(index=self.index_name, id=doc_id)
