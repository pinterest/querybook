#!/usr/bin/env python3
"""Test PyIceberg write with PyArrow schema (no manual Iceberg schema construction)"""

import pandas as pd
import pyarrow as pa
from pyiceberg.catalog import load_catalog

# Create test data
df = pd.DataFrame({"id": [1, 2], "name": ["a", "b"], "value": [10.5, 20.3]})
print("DataFrame:", df)

# Convert to Arrow
arrow_table_temp = pa.Table.from_pandas(df, preserve_index=False)
arrow_schema = arrow_table_temp.schema
print("\nPyArrow schema:", arrow_schema)

# Load catalog
print("\nLoading catalog...")
catalog = load_catalog(
    name="default",
    uri="http://127.0.0.1:19193/iceberg",
    **{"header.HOST": "iceberg-rest-catalog-prod-002.mesh.local", "header.X-Iceberg-Access-Delegation": ""}
)
print("Catalog loaded")

# Drop table if exists
try:
    catalog.drop_table("jennywang.test_iceberg_manual_schema")
    print("Dropped existing table")
except Exception as e:
    print(f"Table doesn't exist: {e}")

# Create table with PyArrow schema directly (no manual Iceberg schema!)
print("\nCreating table with PyArrow schema directly...")
table = catalog.create_table("jennywang.test_iceberg_manual_schema", schema=arrow_schema, properties={"access_group": "non_pii"})
print("Table created")

# Convert DataFrame with field IDs
print("\nConverting DataFrame with Iceberg field IDs...")
arrow_schema_with_ids = table.schema().as_arrow()
print("Arrow schema with field IDs:", arrow_schema_with_ids)
arrow_table = pa.Table.from_pandas(df, schema=arrow_schema_with_ids, preserve_index=False)

# Append
print("\nAppending data...")
table.append(arrow_table)
print("✅ Success! Data appended")

# Verify
print("\nVerifying...")
result = table.scan().to_arrow()
print(f"Table has {len(result)} rows:")
print(result.to_pandas())
