from lib.form import FormField, FormFieldType


load_partitions_field = FormField(
    required=False,
    field_type=FormFieldType.Boolean,
    helper="""In case your data catalog is large, loading all partitions for all tables can be quite time consuming.
    Skipping partition information can reduce your metastore refresh latency
    """,
)
