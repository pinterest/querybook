{% if is_success == True %}
Success: "{{ doc_title }}" (Doc ID: {{ doc_id }}) has completed!
{% else %}q
Failure: "{{ doc_title }}" (Doc ID: {{ doc_id }}) has failed!
{% endif %}

* **Here is the url for the DataDoc: <{{ doc_url }}>**
{% if export_url != None %}
* **Here is the exported query result url: <{{ export_url }}>**
{% elif is_success == False and error_msg != None%}
* **The failure reason: {{ error_msg }}**
{% endif %}
