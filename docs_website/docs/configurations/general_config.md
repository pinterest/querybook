---
id: general_config
title: General Config
sidebar_label: General Config
---

## Overview

Other than the basic infrastructure setup such as rdbms and redis, all configurations can be done in the admin tools on the Querybook website directly. Note that it is only accessible for users under the "Admin" role. You can access the admin panel by clicking on the user icon at the bottom of the left sidebar, then clicking on "Admin." Alternatively, you can visit the URL [https://localhost:10001/admin](https://localhost:10001/admin).

The first user that installs Querybook gets the "Admin" role. Admins can add other admins and modify anyone's role.

In the next section we will go over different things that can be configured in the Admin tools.

:::info
Checkout [Sharing & Security](../overview/sharing_and_security.md) to learn how to configure access permission for these entities.
:::

#### Environment

Environment ensures users on Querybook are only allowed to access to information/query they have permission to. All DataDocs, Query Engines are attached to some environments.

Here are all the fields needed when creating an environment:

-   Name (**required**): The name must be all letters since it will appear in the url.
-   Public: A public environment allows any users of Querybook to use.
-   Archived: Once archived, environments cannot be accessed on the website.
-   Environment description: A short description of the environment which will appear as a tooltip on the environment picker.
-   Logo Url: By default an environment's icon is shown as an square button with the first letter of the environment's name in it. You can also supply a custom image.
-   Hidden: if a user does not have access to the environment, hide the environment.
-   Shareable: If turned off, DataDocs will be private by default and query executions can only be viewed by the owner.

Once an environment is created, you can use `Add/Remove User` to add/remove user access to an environment.

### Metastore

Metastore is used to collect schema/table information from the metastore. Different loaders are needed depending on the use case (i.e, Hive or MySQL). Each loader comes with different parameters that needs to be set. Note that metastore can be shared between environments since they are only referenced indirectly by query engines.

You can use the `add denylist/allowlist` function to limit what table can be accessed via the metastore. Note that this also impacts the query engine that is referencing the metastore.

Once a metastore is created, you can configure the auto sync schedule, manually kick off a metastore sync, and check sync history.

### Query Engine

Query engine configures the endpoints that users can query. Each query engine needs to be attached to an environment for security measures. They can also attach a metastore to allow users to see table information while writing queries. All available query engine executors are grouped by language and each of them have different configuration values that needs to be set.

### Announcement

Querybook Admins can use the announcement feature to send quick updates to users on Querybook.The announcement will appear as a top banner on Querybook's main site. Querybook actively polls the announcement end point five minutes so any change to the announcements are quickly reflected.
Here are all the fields needed when creating an announcement:

-   url prefix: admins can enter a regex so the announcement will only show up if the url matches the regex
-   Hide on dismiss: if this option is on, users can dismiss the announcement and it will be hidden for this user's browser session.
-   Message: the announcement message, note that it allows markdown to be entered.

### User Role

The user role feature allows admin to add other admins or remove admin permission of other admins. At least 1 admin needs to exist on Querybook.

### Job Status

Here you can see all the async celery job's records and filter by name/failure.

### API Access Token

You can use this to view all the api access token issued to users. You can also use it to revoke user's api token access.
