---
id: faq
title: Common Questions
sidebar_label: Common FAQ
---

### Q: My queries failed. What do I do?

Check first if the syntax of the query is correct. Otherwise please check the line message of the error message. There are two common messages:

-   `Error from Query Engine`. Indicates the error is a run time error from the query engine. Please check with the maintainer of the said engine.
-   `Error from Querybook worker`. This is the default error message. It is likely to be caused by misconfiguration of Querybook or an internal bug. Please check with the maintainer of Querybook to find out the root cause of the error.

### Q: My DataDoc is not saving. What should I do?

When DataDoc is autosaving, there should be a spinning loading icon on the top right. First verify if it is an issue with websockets, there are two possible indicators:

-   A red 🔗 icon below the saving icon
-   Notifications with the message `Error: websocket error` shows up

If any one of these shows up please contact the maintainer of Querybook to investigate the cause of the failing websocket connection. Otherwise if the websocket is working properly, you can try to force save a DataDoc by pressing cmd/ctrl+s.

### Q: Is there a way to clone a Query Cell and its executions?

You can copy/cut the cell by hovering over the ⋮ menu on the right and paste the copied cell. Pasting the cell in a doc will carry over all of its query execution history.

### Q: How do I use templating? What capabilities does it have?

You can add templating for DataDoc query cells. Querybook’s templating uses Jinja2 syntax and supports all of its functionalities. You can also define any custom templated variable that can be shared across different cells by clicking the `<>` button on the bottom right, they can infer other variables and be recursively rendered. Some variables/functions are provided automatically. Such as:

-   `{{today}}` which maps to todays date in yyyy-mm-dd
-   `{{yesterday}}` which maps to yesterday’s date
-   `{{latest_partition('<schema_name>.<table_name>', '<partition_key>')}}` which is a function to get the latest partition of a table

### Q:How do I schedule a DataDoc?

You can add a schedule to a DataDoc by clicking on the 🕑 button on the bottom right. A scheduled DataDoc will run the query cells sequentially from the first query cell to the last query cell and would stop if any of the query cell failed to execute. You can configure the schedule to automatically export the query result with a given exporter.

### Q:I found a bug! How do I report it?

Please report bugs [here](https://github.com/pinterest/querybook/issues).

### Q:How do I make a feature request?

Please make feature requests [here](https://github.com/pinterest/querybook/issues).

### Q:Where can I see all the planned features for Querybook?

You can view our roadmap and feature development process [here](https://github.com/pinterest/querybook/projects).
