import re
from abc import abstractmethod
from typing import Literal, Optional

from langchain.docstore.document import Document
from langchain.vectorstores.base import VectorStore
from models.metastore import DataTable
from models.query_execution import QueryExecution


class VectorStoreBase(VectorStore):
    @abstractmethod
    def get_doc_by_id(self, doc_id: str) -> Document:
        raise NotImplementedError()

    @abstractmethod
    def delete_doc_by_id(self, doc_id: str):
        raise NotImplementedError()

    def get_table_summary(self, table_id: int) -> str:
        doc = self.get_doc_by_id(f"table_{table_id}")
        return doc.page_content if doc else ""

    def should_skip_table(self, table: DataTable) -> bool:
        """Whether to skip logging the table to the vector store.

        Override this method to implement custom logic for your vector store."""
        return False

    def should_skip_query_execution(
        self, query_execution: QueryExecution, tables: list[DataTable]
    ) -> bool:
        """Whether to skip logging the query execution to the vector store.

        Override this method to implement custom logic for your vector store."""
        query = query_execution.query

        # TODO: add more filters
        # skip queries if it starts with "select * from"
        pattern = r"^\s*select\s+\*\s+from"
        if re.match(pattern, query, re.IGNORECASE):
            return True

        for table in tables:
            # skip if any table needs to be skipped
            if self.should_skip_table(table):
                return True

        return False

    def search_tables(
        self,
        metastore_id: int,
        text: str,
        search_type: Optional[Literal["table", "query"]] = None,
        threshold=0.6,
        k=3,
        fetch_k=30,
    ) -> list[tuple[int, str, int]]:
        """Find tables using embedding based table search.

        The table search will return a list of k tables that are similar to the given text with highest similarity score.

        Return: a list of tuples (table_name, score)
        """

        must_query = [{"term": {"metadata.metastore_id": metastore_id}}]
        if search_type:
            must_query.append({"term": {"metadata.type": search_type}})
        boolean_filter = {"bool": {"must": must_query}}

        docs_with_score = self.similarity_search_with_score(
            text, k=fetch_k, boolean_filter=boolean_filter
        )
        tables = [
            (table_name, score, doc.metadata.get("type"))
            for (doc, score) in docs_with_score
            for table_name in doc.metadata.get("tables", [])
            if score > threshold
        ]

        table_score_dict = {}
        for table_name, score, type in tables:
            # TODO: need to tune the scoring strategy
            if type == "table" and score >= 0.7:
                score *= 10
            elif type == "query":
                score /= 10

            table_score_dict[table_name] = table_score_dict.get(table_name, 0) + score

        return sorted(table_score_dict.items(), key=lambda x: x[1], reverse=True)[:k]
