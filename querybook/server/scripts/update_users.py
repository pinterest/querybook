from logic.elasticsearch import bulk_update_index_by_fields, update_indices

update_indices("users")
bulk_update_index_by_fields("users", fields=None)
