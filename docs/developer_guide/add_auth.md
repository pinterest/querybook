---
id: add_auth
title: Authentication
sidebar_label: Authentication
---

Datahub deeply integrations with Flask-Login. Please check the Flask-Login guide for main reference https://flask-login.readthedocs.io/en/latest/.

## Adding A New Authentication Method

To add a new authentication, add a new file under <project_root>/datahub/server/app/auth/ and name it <auth_method>\_auth.py. Fundamentally every auth file should export the following 3 things:

-   login(request) (**required**): A function that logs in the user. One common implementation would be:

```
def login(request):
    return login_manager.login(request)
```

-   init_app(app) (**required**): A function that initializes the authentication class. Commonly used to register any callback endpoints. One common implementation would be:

```
def init_app(app):
    login_manager.init_app(app)
```

-   ignore_paths (optional, defaults to []): A list of path strings that can bypass the auth. Please put any callback urls here

Moving on to the login manager itself, you need to use the `DataHubLoginManager` from auth/utils.py as the login manager as it provides api token access. Use a class that has this login manager as a field (check oauth_auth.py as an example) if you need to initialize resources when app starts or use only functions (check password_auth.py as an example) if nothing needs to be initialized.

TODO: add examples of adding ldap auth and okta auth as 2 different authentication methods to implement.

## Plugins

If the authentication method is too specific for your org or it has some post-authentication actions (such as adding users to a specific environment based on their permission), it is recommended to add the auth as part of the plugin. Please check the [Plugin Guide](../admin_guide/plugins.md) to see how setup plugins. Once it is setup and running, simply put your auth code under auth_plugins/ (or any other folder, it is not an enforced restriction) and set AUTH_BACKEND='auth_plugin.<auth_module_name>' as the environment variable.
