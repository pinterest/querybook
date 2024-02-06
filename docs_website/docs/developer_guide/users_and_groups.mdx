---
id: users_and_groups
title: Users and Groups
sidebar_label: Users and Groups
---

Querybook supports adding/loading users and user groups.

## DB Schema
We use the `User` model to represent a user or a group.

A user or a group can have below properties
 - username: It is the unique identifier of a user or a group.
 - fullname: Full name or display name of a user or a group.
 - password: Password of a user. Only applies to users when using default user/password auth.
 - email: Email of a user or a group.
 - profile_img: Profile image url of a user or a group.
 - deleted: To indicate if this user has been deleted/deactivated or not.
 - is_group: To indicate it is a user group if it's true.
 - properties: Any additional properties are stored in this column. It is a freeform JSON object, you can basically add any properties inside it. By default all the properties inside `properties` are private, which are invisiable to end users.
    - public_info: Only properties stored inside `properties.public_info` are visible to end users.
      - description: [optional] Description of a user or a group.


For the detailed DB schema and table relationships, please check the model file [here](https://github.com/pinterest/querybook/blob/master/querybook/server/models/user.py)


## Create/Load Users and Group
For users
  - default user/password authentication: people can sign up as a new user on UI.
  - oauth/ldap authentication: they both support auto-creation of users.

For user groups, they can only be sync'ed now and can not be created on UI. You can have a scheduled task for your organization to sync them from either ldap, metastore or any other system which contains user groups.


## Group Permissions
Querybook users can inherit permissions from groups to gain access to boards and datadocs alongside their explicit permissions. Likewise, user groups can also inherit permissions from other user groups. Whether a user or group is a member of two distinct groups or inherits permissions from multiple nested groups, the most permissive permissions are applied.

For example, if a user is a member of two groups, one with read-only access and the other with write access, the user will have write access. If a user is a member of a group with read-only access and a group with no access, the user will have read-only access.

User groups can be used to manage permissions for a large number of users. For example, you can create a group for all users in a team and assign permissions to the group. When a new user joins the team, you can add them to the group and they will inherit all of the permissions of the group. However, user groups cannot be assigned as the owners of a board or datadoc.
