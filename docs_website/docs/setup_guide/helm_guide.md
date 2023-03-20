---
id: helm_guide
title: Helm Deployment Guide
sidebar_label: Helm Deployment Guide
---

If you are planning to deploy on Kubernetes, you can use a Helm Chart inside `/helm` folder. You can customize `values.yaml` and template files based on your needs. There are several principles that you **MUST** check before setting up your own production deployment.

1. You should set up your own secret values. Currently, `flask_secret_key`, `database_conn`, `redis_url` and `elasticsearch_host` is defined as a default value. You must change the secret value based on your own needs. If you are planning to use own redis/elasticsearch, you should change `enabled` to `false` in redis/elasticsearch, and change `redis_url`/`elasticsearch_host` appropriately.
2. Please add your own ingress host. Below `hosts`, you should define your querybook app domain, and add tls secret if you need so. Also, you should define `PUBLIC_URL` below `extraEnv` as your own app domain.
3. We strongly advise to use your own database instead of default MySQL. However, if you are planning to use default MySQL deployment, please change `dbsettings` to your own customized secret in order to prevent any security issues.
4. If you need any other Querybook environmental variables, you can inject below `extraEnv`.
