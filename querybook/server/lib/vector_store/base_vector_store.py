from abc import abstractmethod
import re

from langchain.vectorstores.base import VectorStore

from models.metastore import DataTable
from models.query_execution import QueryExecution


class VectorStoreBase(VectorStore):
    @abstractmethod
    def delete_doc_by_id(self, doc_id: str):
        raise NotImplementedError()

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

    def search_tables(self, text: str, threshold=0.6, k=3):
        """Find tables using embedding based table search.

        The table search will return a list of k tables that are similar to the given text with highest similarity score.
        """
        docs_with_score = self.similarity_search_with_score(text, k=3)
        tables = [
            (table, score)
            for (doc, score) in docs_with_score
            for table in doc.metadata.get("tables", [])
            if score > threshold
        ]

        table_score_dict = {}
        for table, score in tables:
            table_score_dict[table] = max(score, table_score_dict.get(table, 0))

        sorted_tables = sorted(
            table_score_dict.items(), key=lambda x: x[1], reverse=True
        )

        return [t for t, _ in sorted_tables[:k]]
