---
id: add_surveys
title: Add Surveys
sidebar_label: Add  Surveys
---

Product surveys serve as an excellent tool to gather user feedback. Querybook supports several kinds of surveys out-of-the-box, including:

1. **Table search**: Users can indicate if the table search results matched their expectations.
2. **Table trust**: Users can rate their trust in the provided table metadata.
3. **Text to SQL**: Users can evaluate the quality of AI-generated SQL code.
4. **Query authoring**: Users can rate their experience of writing queries on Querybook.

Each of these surveys follows the same 1-5 rating format, complemented by an optional text field for additional comments.
By default, the surveys are disabled. If you wish to enable them, override the `querybook/config/querybook_public_config.yaml` file.

Below is an example of a setting that enables all surveys:

```yaml
survey:
    global_response_cooldown: 2592000 # 30 days
    global_trigger_cooldown: 600 # 10 minutes
    global_max_per_week: 6
    global_max_per_day: 3

    surfaces:
        - surface: table_search
          max_per_week: 5
        - surface: table_view
          max_per_day: 4
        - surface: text_to_sql
          response_cooldown: 24000
        - surface: query_authoring
```

To activate a survey for a specific surface, you need to include the relevant surface key under `surfaces`.
You can find out the list of all support surfaces in `SurveyTypeToQuestion` located under `querybook/webapp/const/survey.ts`.

There are 4 variables that you can configure either for eaceh individual surface or globally for surveys, they are:

-   **response_cooldown**: Time (in seconds) the system waits before showing the same survey to a user who has already responded.
-   **trigger_cooldown**: Waiting period before the same survey is shown to the same user.
-   **max_per_week**: Maximum number of surveys shown to a user per week (per surface type).
-   **max_per_day**: Daily limit for the number of surveys shown to a user (per surface type).
