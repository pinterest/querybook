---
id: custom_app_name
title: Custom App Name
sidebar_label: Custom App Name
---

By default, the frontend website displays the application name as `Querybook`. However, you may want to use another name that aligns with your backend systems. This name change is for frontend display only and does not impact the backend configurations.

To do so, rebuild the Webpack files with the environment variable `QUERYBOOK_APPNAME`. For example, you can have a Dockerfile as such:

```Dockerfile
FROM querybook:latest

RUN QUERYBOOK_APPNAME=Example ./node_modules/.bin/webpack --mode=production
```

The website served by this docker image will show "Welcome to Example" on the homepage with the browser title as "Example".

You can use any utf8 characters but it’s recommended to keep the length to be roughly shorter than 15 English characters to prevent text-overflow.
