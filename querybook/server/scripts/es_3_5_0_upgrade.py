from logic.elasticsearch import bulk_update_index_by_fields, update_indices

update_indices("query_executions", "query_cells")
bulk_update_index_by_fields("query_executions", ["id", "public", "readable_user_ids"])
bulk_update_index_by_fields("query_cells", ["id", "public", "readable_user_ids"])
