{% if query_execution.status.value == 3 -%}
Success: "{{ query_title }}" (Query ID: {{ query_execution.id }}) has completed.
{% else -%}
Failed: "{{query_title}}" (Query ID: {{ query_execution.id }}) has failed.
{% endif %}

{% if doc_id != None %}
**Here is the url for the DataDoc: <{{ public_url }}/{{ env_name }}/datadoc/{{ doc_id }}/?cellId={{ cell_id }}&executionId={{ query_execution.id }}>**
{% endif %}

**Here is the url for the execution: <{{ public_url }}/{{ env_name }}/query_execution/{{ query_execution.id }}/>**
