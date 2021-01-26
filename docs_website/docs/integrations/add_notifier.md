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

To keep the notification process standardized, the standard notifiers are included under <project_root>/querybook/server/lib/notify/notifiers,
but for custom notifiers create them under <project_root>/plugins/notifier_plugin/.
All notifiers must inherit from BaseNotifier that lives in <project_root>/querybook/server/lib/notify/base_notifier.py.

Here are some fields of notifier that you must configure in the setup process:

-   NOTIFIER_NAME: This will get displayed on the Querybook website.
-   NOTIFIER_FORMAT: This is the text format of the message that will be sent, by default Querybook supports:
    -   `markdown`
    -   `plaintext`
    -   `html`
-   notify(user, message,): This is the actual notification sending function. User is provided for access to the information of the user that the notification is being sent to. Message is the markdown-formatted content of the notification that will be sent.

If you want to add a notifier that's specific to your own use case, please do so through plugins (See this [Plugin Guide](plugins.md) to learn how to setup plugins for Querybook).

Once plugins folder is setup, import the notifier class under `ALL_PLUGIN_NOTIFIERS` in notifier_plugin/**init**.py .
