---
id: users_and_groups
title: Users and Groups
sidebar_label: Users and Groups
---

Querybook supports adding/loading users and user groups.  

## DB Schema
We use the `User` model to represent a user or a group.

A user or a group can have below properties
 - username: It is the unique iendifiter of a user or a group.
 - fullname: Full name or display name of a user or a group
 - password: Password of a user. Only applies to a user.
 - email: Email of a user or a group.
 - profile_img: Profile image of a user or a group.
 - deleted: To indicate if this user has been deleted/deactivated or not.
 - is_group: To indicate it is a user group if it's true.
 - properties: Any addiontal properties are stored in this column. It is a freeform JSON object, you can basically add any properties inside it. By default all the properties inside `properties` are private, which are invisiable to end users. 
    - public_info: Only properties stored inside `properties.public_info` are visible to end users.
      - description: [optional] Description of a user or a group.


For the detailed DB schema and table relationships, please check the model file [here](https://github.com/pinterest/querybook/blob/master/querybook/server/models/user.py)


## Load Users and Group
If you're not using the default username/password authentication, you probably need to sync the users/groups regularly from your organization's sysmtem into Querybook. To do this, you can 
    1. add and register a celery task to load all the users/groups to Querybook db
    2. create and schedule a new task through the admin task tool (`/admin/task/`)
