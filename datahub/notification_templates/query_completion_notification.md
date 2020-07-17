{% if query_execution.status.value == 2 -%}
Success: "{{ query_title }}" (Query ID: {{ query_execution.id }}) has completed.
{% else -%}
Failed: "{{query_title}}" (Query ID: {{ query_execution.id }}) has failed.
{% endif %}

* **Here is the url for the DataDoc: <{{ public_url }}/{{ env_name }}/datadoc/{{ doc_id }}/?cellId={{ cell_id }}&executionId={{ query_execution.id }})>**

* **Here is the url for the execution: <{{ public_url }}/{{ env_name }}/datadoc/{{ doc_id }}/?cellId={{ cell_id }}&executionId={{ query_execution.id }})>**
