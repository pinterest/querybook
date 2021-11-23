from lib.form import FormField, StructFormField, FormFieldType, ExpandableFormField

hive_executor_template = StructFormField(
    hive_resource_manager=FormField(
        description="Provide resource manager link here to provide insights"
    ),
    connection_string=FormField(
        required=True,
        description="Put your JDBC connection string here",
        regex="^(?:jdbc:)?hive2:\\/\\/([\\w.-]+(?:\\:\\d+)?(?:,[\\w.-]+(?:\\:\\d+)?)*)\\/(\\w*)((?:;[\\w.-]+=[\\w.-]+)*)(\\?[\\w.-]+=[\\w.-]+(?:;[\\w.-]+=[\\w.-]+)*)?(\\#[\\w.-]+=[\\w.-]+(?:;[\\w.-]+=[\\w.-]+)*)?$",  # noqa: E501
        helper="""
<p>
Format
jdbc:hive2://&lt;host1&gt;:&lt;port1&gt;,&lt;host2&gt;:&lt;port2&gt;/dbName;sess_var_list?hive_conf_list#hive_var_list
</p>
<p>Currently support zookeeper in session var, and will pass any conf variables to HS2</p>
<p>See [here](https://cwiki.apache.org/confluence/display/Hive/HiveServer2+Clients#HiveServer2Clients-JDBC) for more details.
</p>""",
    ),
    username=FormField(regex="\\w+"),
    password=FormField(hidden=True),
    impersonate=FormField(field_type=FormFieldType.Boolean),
)

presto_executor_template = StructFormField(
    connection_string=FormField(
        required=True,
        regex="^(?:jdbc:)?presto:\\/\\/([\\w.-]+(?:\\:\\d+)?(?:,[\\w.-]+(?:\\:\\d+)?)*)(\\/\\w+)?(\\/\\w+)?(\\?[\\w.-]+=[\\w.-]+(?:&[\\w.-]+=[\\w.-]+)*)?$",  # noqa: E501
        helper="""
<p>Format jdbc:presto://&lt;host:port&gt;/&lt;catalog&gt;/&lt;schema&gt;?presto_conf_list</p>
<p>Catalog and schema are optional. We only support SSL as the conf option.</p>
<p>See [here](https://prestodb.github.io/docs/current/installation/jdbc.html) for more details.</p>""",
    ),
    username=FormField(regex="\\w+"),
    password=FormField(hidden=True),
    impersonate=FormField(field_type=FormFieldType.Boolean),
    proxy_user_id=FormField(
        field_type=FormFieldType.String,
        helper="""
<p>User field used as proxy_user. proxy_user will be forwaded to Presto as the session user.</p>
<p>Defaults to username. Possible values are username, email, fullname </p>
<p>See [here](https://prestodb.github.io/docs/current/installation/jdbc.html) for more details.</p>""",
    ),
)

trino_executor_template = StructFormField(
    connection_string=FormField(
        required=True,
        regex="^(?:jdbc:)?trino:\\/\\/([\\w.-]+(?:\\:\\d+)?(?:,[\\w.-]+(?:\\:\\d+)?)*)(\\/\\w+)?(\\/\\w+)?(\\?[\\w.-]+=[\\w.-]+(?:&[\\w.-]+=[\\w.-]+)*)?$",  # noqa: E501
        helper="""
<p>Format jdbc:trino://&lt;host:port&gt;/&lt;catalog&gt;/&lt;schema&gt;?trino_conf_list</p>
<p>Catalog and schema are optional. We only support SSL as the conf option.</p>
<p>See [here](https://trino.io/docs/current/installation/jdbc.html) for more details.</p>""",
    ),
    username=FormField(required=True, regex="\\w+"),
    impersonate=FormField(field_type=FormFieldType.Boolean),
    proxy_user_id=FormField(
        field_type=FormFieldType.String,
        helper="""
<p>User field used as proxy_user. proxy_user will be forwaded to Trino as the session user.</p>
<p>Defaults to username. Possible values are username, email, fullname </p>
<p>See [here](https://trino.io/docs/current/installation/jdbc.html) for more details.</p>""",
    ),
)

sqlalchemy_template = StructFormField(
    connection_string=FormField(
        required=True,
        helper="""
<p>
    See [here](https://docs.sqlalchemy.org/en/latest/core/engines.html#database-urls) for more details.
</p>""",
    ),
    connect_args=ExpandableFormField(
        of=StructFormField(
            key=FormField(required=True),
            value=FormField(required=True),
            isJson=FormField(
                field_type=FormFieldType.Boolean,
                helper="If true, then the value will be parsed as JSON",
            ),
        )
    ),
)

bigquery_template = StructFormField(
    google_credentials_json=FormField(
        helper="The JSON string used to log in as service account. If not provided then **GOOGLE_CREDS** from settings will be used.",
    )
)

salesforce_cdp_template = StructFormField(
    password=FormField(hidden=True,helper="The password for the CDP Salesforce org instance."),
    username=FormField(regex="\\w+",helper="The user name for the CDP Salesforce org instance."),
    loginurl=FormField(helper="Login url, example https://login.salesforce.com")
)
