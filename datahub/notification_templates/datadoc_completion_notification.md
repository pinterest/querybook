{% if is_success -%}
Success: "{{ doc_title }}" (Doc ID: {{ doc_id }}) has completed!
{% else -%}
Failure: "{{ doc_title }}" (Doc ID: {{ doc_id }}) has failed!
{% endif %}

-   **Here is the url for the DataDoc: <{{ doc_url }}>**
    {% if export_urls|length > 0 %}
-   **Here is the exported query result url:**
    {% for export_url in export_urls %}
    <{{ export_url }}>
    {% endfor %}
    {% elif is_success == False and error_msg != None %}
-   **The failure reason: {{ error_msg }}**
    {% endif %}
