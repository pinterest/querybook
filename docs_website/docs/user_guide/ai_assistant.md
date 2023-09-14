---
id: ai_assistant
title: AI Assistant
sidebar_label: AI Assistant
---

If the [AI Assistant plugin](../integrations/add_ai_assistant.md) is enabled, you'll be able to use below AI features powered by LLM.

## Title Generation

Click the '#' icon will generate title of the query cell automatically.
![](/img/user_guide/title_generation.gif)

## Text To SQL

Hover over to the left side of the query cell and click the star-like icon will open the text-to-sql modal.

### Query Generation

To use it: select the table(s) you are going to query against and type your question prompt and hit Enter.

If you're unsure which table to use, you can also type your question directly and AI will try to find the table(s) for you.

![](/img/user_guide/text_to_sql.gif)

### Query Editing

If you would like to modify the generated query, you can keep the query and type in the prompt to edit it.

If the query cell already has a query, open the text-to-sql modal will automatically go to the edit mode.

![](/img/user_guide/text_to_sql_edit.gif)

## SQL Fix

If your query failed, you will see ‘Auto fix’ button on the right corner of the error message

![](/img/user_guide/sql_fix.gif)

## Search Table by Natural Language

If [vector store](../integrations/add_ai_assistant.md#vector-store) of the AI assistant plugin is also enabled, you'll be able to search the tables by natual language as well as keyword based search.

![](/img/user_guide/table_vector_search.png)
