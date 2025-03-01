## Variables

`{{ today }}`: Map to today's date in UTC in **yyyy-mm-dd** format.
Example use case:

```sql
SELECT * FROM users WHERE created_at = '{{ today }}';
```

Gets rendered to:

```sql
SELECT * FROM users WHERE created_at = '2022-02-25';
```

<br />

`{{ yesterday }}`: Map to yesterday's date in UTC in **yyyy-mm-dd** format.

Example use case:

```sql
SELECT * FROM users WHERE created_at = '{{ yesterday }}';
```

Gets rendered to:

```sql
SELECT * FROM users WHERE created_at = '2022-02-24';
```

## Functions

`{{ latest_partition('<schema_name>.<table_name>', '<partition_key>') }}`:
This function can be used to get the latest partition of a table. It queries the metastore directly to get the latest partition.
The first parameter is **required** and must be the full table name with schema name. The second parameter is **optional** if there is only 1 partition key.

Example use case 1:

Suppose we have a table called _default.users_ and it has 2 partition keys: dt and type. We can query both like so:

```sql
SELECT * FROM default.users
WHERE dt = '{{ latest_partition("default.users", "dt") }}' AND type = '{{ latest_partition("default.users", "type") }}';
```

This gets rendered to:

```sql
SELECT * FROM default.users
WHERE dt = '2022-02-25' AND type = 'unauth';
```

Example use case 2:

Now suppose we have a table called _default.pins_ and it only has 1 partition key: dt. We can query like so:

```sql
SELECT * FROM default.pins
WHERE dt = '{{ latest_partition("default.pins") }}';
```

This gets rendered to:

```sql
SELECT * FROM default.pins
WHERE dt = '2022-02-25';
```

## Airflow Templates

To simplify the process of using queries copied from Airflow, we provide support for the Airflow template variables and macros listed below. For additional information on Airflow templates, please visit [here](https://airflow.apache.org/docs/apache-airflow/stable/templates-ref.html).

### Variables

`{{ ds }}`: Same as `{{ yesterday }}`

### Macros

`{{ macro.ds_add(ds, days) }}`: Add or subtract days from a YYYY-MM-DD.

Example 1:

```sql
SELECT * FROM default.users
WHERE dt = '{{ macros.ds_add("2025-02-28", -5) }}'
```

will get

```sql
SELECT * FROM default.users
WHERE dt = '2025-02-23'
```

Example 2:

```sql
SELECT * FROM default.users
WHERE dt = '{{ macros.ds_add(ds, -5) }}'
```

will get (assuming today is 2025-02-28)

```sql
SELECT * FROM default.users
WHERE dt = '2025-02-22'
```
