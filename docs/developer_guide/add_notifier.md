---
id: add_notifier
title: Notifier
sidebar_label: Notifier
---

## What is an notifier?

Notifiers provide the option for users to be notified upon completion of their queries. Some example of notifiers are:

-   Email
-   Slack
-   Microsoft Teams

## Implementation

To keep the notification process standardized, please create an notifier under <project_root>/datahub/server/lib/notify/notifiers.
All notifiers must inherit from BaseNotifier that lives in <project_root>/datahub/server/lib/notify/base_notifier.py.

Here are some fields of notifier that you must configure in the setup process:

-   NOTIFIER_NAME: This will get displayed on the DataHub website.
-   NOTIFIER_FORMAT: This is the text format of the message that will be sent and must be one of the following:
    - `markdown`
    - `plaintext`
    -  `html`
-   notify(user, message, subject): This is the actual notification sending function.  User is provided for access to the information of the user that
the notification is being sent to. Message is the message that will be sent and should be converted to the notifier format. Subject is
used as a heading for the notification, which is useful for services like email which use a subject line.

If you want to add a notifier, please do so through plugins (See this [Plugin Guide](../admin_guide/plugins.md) to learn how to setup plugins for DataHub).

Once plugins folder is setup, import the notifier class under `ALL_PLUGIN_NOTIFIERS` in notifier_plugin/**init**.py .
