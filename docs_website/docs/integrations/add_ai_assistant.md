---
id: add_ai_assistant
title: AI Assistant
sidebar_label: AI Assistant
---

:::info
Please check the [user guide](../user_guide/ai_assistant.md) of how the AI assistant features look like.
:::

The AI assistant plugin is powered by LLM(Large Language Model), like ChatGPT from openai. We're using [Langchain](https://python.langchain.com/docs/get_started/introduction) to build the plugin.

## AI Assistant Plugin

The AI Assistant plugin will allow users to do title generation, text to sql and query auto fix.

Please follow below steps to enable AI assistant plugin:

1. [Optional] Create your own AI assistant provider if needed. Please refer to `querybook/server/lib/ai_assistant/openai_assistant.py` as an example.

2. Add your provider in `plugins/ai_assistant_plugin/__init__.py`

3. Add configs in the `querybook_config.yaml`. Please refer to `containers/bundled_querybook_config.yaml` as an example. Please also check the model's official doc for all avaialbe model args.

    - Dont forget to set proper environment variables for your provider. e.g. for openai, you'll need `OPENAI_API_KEY`.

4. Enable it in `querybook/config/querybook_public_config.yaml`

## Vector Store Plugin

The vector store plugin supports embedding based table search using natural language. It requires an embeddings provider and a vector store. Please check Langchain docs for more details of available [embeddings](https://python.langchain.com/docs/integrations/text_embedding/) and [vector stores](https://python.langchain.com/docs/integrations/vectorstores/).

:::note
How to set up and host a vector store or use a cloud vector store solution is not covered here. You can choose your own vector db solution.
:::

1. [Optional] Create your own embeddings or vector store if needed. Please refer to `querybook/server/lib/vector_store/stores/opensearch.py` as an example

2. Add the providers in `plugins/vector_store_plugin/__init__.py`

3. Add configs in the `querybook_config.yaml`. Please refer to `containers/bundled_querybook_config.yaml` as an example. Please also check Langchain doc for configs each vector store requires.

    - Also dont forget to set proper environment variables for your provider. e.g. for openai embeddings, you'll need `OPENAI_API_KEY`.

4. Enable it in `querybook/config/querybook_public_config.yaml`

With vector store plugin enabled, text-to-sql will also use it to find tables if tables are not provided by the user.

### Initilize the Vector Index

In Docker based deployments, attach to `web` or `worker` component and run

    ```shell
    python ./querybook/server/scripts/init_vector_store.py
    ```

It will add summary for all tables and sample query summary of the tables to the vector store. If you'd like to only index part of the tables, you can follow the example of `ingest_vector_index` to create your own script.
