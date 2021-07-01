---
id: add_result_store
title: Result Store
sidebar_label: Result Store
---

## S3

### Necessary Field for Configuration

Following environment variables are required for configuration.
If you use a shared credentials file in a default location of `~/.aws/credentials`, a default profile will be used.

```yaml
# Requred for boto3
AWS_ACCESS_KEY: '---Redacted---'
AWS_SECRET_ACCESS_KEY: '---Redacted---'
```

## Adding a new result store for main repo

Add the new store code under lib/result_store/stores/. Make sure both the reader and uploader inherit from base_store.py that's in the same folder.
Once the code is completed, include in the lib/result_store/all_result_stores.py. Follow the examples of s3 and db store and choose a single word prefix name to represent the result store.

To use the store in production, set the environment variable ALL_PLUGIN_RESULT_STORES to be the same as the result store name (the one chosen in all_result_stores.py).

### Adding the new engine as a plugin

If you cannot include this result store as part of the open source project, you can also add it as a [plugin](plugins.md).

1. Locate the plugin root directory for your customized Querybook, and find the folder called result_store_plugin.
2. Add your result store code similiar to what's above, which means making sure it inherits from base_store.py.
3. Add the new reuslt store along with its representative name in the variable ALL_PLUGIN_RESULT_STORES under result_store_plugin/\_\_init\_\_.py
