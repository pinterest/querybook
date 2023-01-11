// Make sure this is in increasing order
// export const test = 5;
import QueryResultLimitConfig from 'config/query_result_limit.yaml';

export const StatementExecutionDefaultResultSize =
    QueryResultLimitConfig.default_query_result_size;
export const StatementExecutionResultSizes =
    QueryResultLimitConfig.query_result_size_options;
