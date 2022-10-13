The guide here serves as quick reference of the Jinja2 syntax. For a more complete view, [see the complete Jinja guide here](https://jinja.palletsprojects.com/en/2.11.x/templates/).

## Defining variables

Using the templated variable config, you can define key value pairs where the key is the variable name.
Note that the currently supported variable type are string, number, and boolean.

You can also reference another variable in the variable definition. For example, suppose you have defined

```py
foo = 'hello'
bar = '{{ foo }} world'
```

When `bar` is used in templating, it is actually rendered to 'hello world'. This is applicable for predefined
variables such as today and yesterday as well. If there is a recursive references in variable, then Querybook
will throw template render errors.

## Using variables

To use a variable inside a query, simply wrap the variable name with `{{ variable }}`. As an example, let's continue with the
setup above. In a query if you put the following:

```sql
SELECT * FROM table where value = '{{ foo }}'
```

Then it gets rendered into

```sql
SELECT * FROM table WHERE value = 'hello'
```

Note that the quotes are required since `{{ foo }}` maps to `hello` instead of `'hello'`.

## Conditionals and loops

To define loops or if statements, use `{% %}`. For example, this is a if statement that checks the value of foo:

```sql
SELECT * FROM table WHERE
{% if foo == 'hello' %}
    value = '{{ bar }}'
{% endif %}
```

This would get rendered into `SELECT * FROM table WHERE value = 'hello world'`.

A more advanced use case is to combine for loops and if conditions. For example, suppose that instead of checking `year in (2012, 2013, 2014)`, I want to check using `year = 2012 OR year = 2013 OR year = 2014`.
It can be done using for loops like so:

```jinja2
{% for year in [2012, 2013, 2014] %}
  {% if loop.index0 != 0 %}
    OR
  {% endif %}
  year = {{ year }}
{% endfor %}
```

## Functions

Last but not least, you can call functions using the same syntax that references variables. For example, if you want to call the function `latest_partition` with table name equal to the value
of foo and the partition key as `'dt'` then simply put:

```jinja2
{{ latest_partition(foo, 'dt') }}
```

which is equivalent to

```jinja2
{{ latest_partition('hello', 'dt') }}
```

This will return the latest dt partition of the `hello` table.

Please check out the `Predefined` section for other functions you can use. In addition, you can also use any of the functions provided by [Jinja](https://jinja.palletsprojects.com/en/2.11.x/templates/#list-of-builtin-filters).
