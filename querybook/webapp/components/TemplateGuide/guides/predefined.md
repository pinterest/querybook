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
