from enum import Enum


# KEEP IT CONSISTENT AS webapp/const/aiAssistant.ts
class AICommandType(Enum):
    SQL_FIX = "sql_fix"
    SQL_TITLE = "sql_title"
    TEXT_TO_SQL = "text_to_sql"
    SQL_SUMMARY = "sql_summary"
    TABLE_SUMMARY = "table_summary"
    TABLE_SELECT = "table_select"


AI_ASSISTANT_NAMESPACE = "/ai_assistant"


DEFAULT_SAMPLE_QUERY_COUNT = 50
MAX_SAMPLE_QUERY_COUNT_FOR_TABLE_SUMMARY = 5


# the minimum score for a table to be considered as a match
DEFAULT_SIMILARITY_SCORE_THRESHOLD = 0.6
# the minimum score for a table to be considered as a great match
DEFAULT_SIMILARITY_SCORE_THRESHOLD_GREAT_MATCH = 0.7
# how many docs to fetch from vector store, it may include both table and query summary docs and they need additional processing.
DEFAULT_VECTOR_STORE_FETCH_LIMIT = 30
# how many tables to return from vector table search eventually
DEFAULT_TABLE_SEARCH_LIMIT = 10
# how many tables to select for text-to-sql
DEFAULT_TABLE_SELECT_LIMIT = 3
