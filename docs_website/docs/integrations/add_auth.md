---
id: add_auth
title: Authentication
sidebar_label: Authentication
---

Querybook deeply integrations with Flask-Login. Please check the Flask-Login guide for main reference https://flask-login.readthedocs.io/en/latest/.

## Supported authentications

-   OAuth
-   Google OAuth
-   LDAP
-   User/Password (default)

The user/password authentication method is used by default but it cannot be integrated with your organization's current auth system. Hence for production use cases, it is recommended to use authn methods such as OAuth.

## Using an existing authentication

We will go through how to setup authentication with OAuth and LDAP starting from the [devserver](../setup_guide/quick_setup.md). Before starting, you should checkout the required fields in [Infra Config](../configurations/infra_config.md#authentication). All fields that starts with OAUTH\_ are required for OAuth, and similarily for LDAP. For Google OAuth, only client id and client secrets are needed since other fields are provided by Google. If you need customized behavior for OAuth/LDAP, you can extend the class, see [below](#adding-a-new-authentication-method) for details.

### OAuth

Start by creating an OAuth client with the authentication provider (e.g. [Google](https://developers.google.com/identity/protocols/oauth2), [Okta](https://developer.okta.com/docs/guides/implement-oauth-for-okta/create-oauth-app/), [GitHub](https://docs.github.com/en/developers/apps/building-oauth-apps/creating-an-oauth-app)). Make sure "http://localhost:10001/oauth2callback" is entered as allowed redirect uri. Once created, the next step is to change the querybook config by editing `containers/bundled_querybook_config.yaml`. Open that file and enter the following:

#### Generic OAuth

```yaml
AUTH_BACKEND: 'app.auth.oauth_auth' # Same as import path when running Python
OAUTH_CLIENT_ID: '---Redacted---'
OAUTH_CLIENT_SECRET: '---Redacted---'
OAUTH_AUTHORIZATION_URL: https://accounts.google.com/o/oauth2/v2/auth
OAUTH_TOKEN_URL: https://oauth2.googleapis.com/token
OAUTH_USER_PROFILE: https://openidconnect.googleapis.com/v1/userinfo
PUBLIC_URL: http://localhost:10001
```

#### Google

```yaml
AUTH_BACKEND: 'app.auth.google_auth'
OAUTH_CLIENT_ID: '---Redacted---'
OAUTH_CLIENT_SECRET: '---Redacted---'
PUBLIC_URL: http://localhost:10001
```

#### Okta

```yaml
AUTH_BACKEND: 'app.auth.okta_auth'
OAUTH_CLIENT_ID: '---Redacted---'
OAUTH_CLIENT_SECRET: '---Redacted---'
OKTA_BASE_URL: https://[Redacted].okta.com/oauth2
PUBLIC_URL: http://localhost:10001
```

#### GitHub

```yaml
AUTH_BACKEND: app.auth.github_auth
PUBLIC_URL: http://localhost:10001
OAUTH_CLIENT_ID: '---Redacted---'
OAUTH_CLIENT_SECRET: '---Redacted---'
```

#### Azure

```yaml
AUTH_BACKEND: app.auth.azure_auth
PUBLIC_URL: http://localhost:10001
AZURE_TENANT_ID: '---Redacted---'
OAUTH_CLIENT_ID: '---Redacted---'
OAUTH_CLIENT_SECRET: '---Redacted---'
```

:::caution
DO NOT CHECK IN `OAUTH_CLIENT_SECRET` to the codebase. The example above is for testing only. For production, please use environment variables to provide this value.
:::

Once entered, relaunch the container with `docker restart querybook_web_1` and visit the localhost website. It should redirect you to the OAuth login page.

### LDAP

LDAP is much easier to setup compared to OAuth, put the following into `containers/bundled_querybook_config.yaml`:

```yaml
AUTH_BACKEND: 'app.auth.ldap_auth' # Same as import path when running Python
LDAP_CONN: 'ldaps://[LDAP_SERVER]'
LDAP_USER_DN: 'uid={},dc=example,dc=com'
```

Restart the container with `docker restart querybook_web_1` and it should work.

## Adding A New Authentication Method

To add a new authentication, add a new file under <project_root>/querybook/server/app/auth/ and name it <auth_method>\_auth.py. Fundamentally every auth file should export the following 3 things:

-   login(request) (**required**): A function that logs in the user. One common implementation would be:

```py
def login(request):
    return login_manager.login(request)
```

-   init_app(app) (**required**): A function that initializes the authentication class. Commonly used to register any callback endpoints. One common implementation would be:

```py
def init_app(app):
    login_manager.init_app(app)
```

-   ignore_paths (optional, defaults to []): A list of path strings that can bypass the auth. Please put any callback urls here

Moving on to the login manager itself, you need to use the `QuerybookLoginManager` from auth/utils.py as the login manager as it provides api token access. Use a class that has this login manager as a field (check oauth_auth.py as an example) if you need to initialize resources when app starts or use only functions (check password_auth.py as an example) if nothing needs to be initialized.

<!-- TODO: add examples of adding ldap auth and okta auth as 2 different authentication methods to implement. -->

## Plugins

If the authentication method is too specific for your org or it has some post-authentication actions (such as adding users to a specific environment based on their permission), it is recommended to add the auth as part of the plugin. Please check the [Plugin Guide](plugins.md) to see how setup plugins. Once it is setup and running, simply put your auth code under auth_plugins/ (or any other folder, it is not an enforced restriction) and set AUTH_BACKEND='auth_plugin.<auth_module_name>' as the environment variable.
