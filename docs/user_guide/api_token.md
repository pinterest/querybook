---
id: api_token
title: Api Token Guide
sidebar_label: Api Token
---

## Creating an api token

1. Click on your user profile icon which is located on the bottom left of the page to bring up the user settings page.

2. Click on "API Access Token" and then click "Create a Token"

3. Now copy the string and use it as your API token, this the only time you can read the token on Querybook! If you did forget the token string, you can always regenerate a new one.

## How to use an api token

In request header of your script, include: `'api-access-token': <token>`, now Querybook will auth you as if you are logged in.
