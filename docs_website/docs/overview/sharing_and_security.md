---
id: sharing_and_security
title: Sharing & Security
sidebar_label: Sharing & Security
---

To understand how security & access restrictions work, let's first go over the core entities of Querybook. They are:

-   Environments
-   DataDocs
-   Tables & Schemas
-   Metastore
-   Query Engines
-   Query Executions

All of these entities can be connected to each other as a tree where the environment is the root node. All DataDocs are required to be inside a single environment whereas query engines have many to many relationships with environments. Each query engine can belong to a single metastore, and every metastore is associated with 0 or more tables/schemas. Last, each query execution must belong to a query engine.

When checking if a user has access to a certain entity in Querybook, Querybook would walk up the tree all the way to environments. Since there are many to many relationships, an entity may be related to multiple environments. If the user can access any one of them, then they can access the entity.

The granularity of access can be configured further with environment configs. Currently, here are all the options to configure an Environment in Querybook:

-   Public
-   Hidden
-   Shareable

A public environment means anyone who has access to the Querybook tool can access this environment. To only allow certain users to access the environment, you need to change the environment to private and add users one by one to the environment ACL. This can be done either in the Admin UI manually or through a dynamic script that runs automatically via the jobs plugin.

A hidden environment means that the user would not see the environment if they do not have access to it. Sometimes, it is useful to turn that option off to let the user know an environment exists, but they do not have access to it.

The shareable option is the most complex environment configuration for Querybook. By default, all DataDocs created in an environment is a public DataDoc, so all users who can access that environment can view the DataDoc. Similarly, all users in that environment can access all query executions associated with that environment. The shareable option is on by default as it simplifies the number of operations required to share a DataDoc or a query execution with someone else. If the shareable option is turned off, then all DataDocs created within an environment would be private by default, and query executions can only be viewed by the user who executed it or anyone who has access to the DataDoc that contains the execution. The owner can still invite others to view by either sharing the DataDoc/execution manually.

:::note
For a public DataDoc, users cannot edit it unless they are invited with edit permission. Furthermore, DataDocs in a shareable environment can still be converted to private so they are not accessible to the public.
:::

As a footnote, searching for DataDocs' access permission is verified at the environment level, searching for Tables is verified at the metastore level, and searching for users is available to all users on Querybook. Both public/private DataDocs can be searched, but the user would only see search results that they have access to.
