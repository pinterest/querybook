---
id: deployment_guide
title: Deployment Guide
sidebar_label: Deployment Guide
---

While there are many ways to deploy Querybook to production, there are some general principles
that are recommended when setting up your own production deployment.

1. Please make sure the web server, the celery beat scheduler, and the celery worker are using the production Docker image. Please refer to `containers/docker-compose.prod.yml` to see how to launch these images for production.
2. To get logs, make sure /var/log/querybook/ is mounted as a Docker volume so that the logs can be moved to the host machine.
3. Use the /ping/ endpoint for health checks.
    1. During deployments, you can create a file that has the path `/tmp/querybook/deploying` (mount the directory from the host system as a volume) to make the health check endpoint /ping/ return 503 and remove it after completion.
4. Please make sure celery worker is ran with concurrent mode as it is the only mode that can have a memory limit per worker.
5. During worker deployments, you can run the following first to make the celery worker stop receving new tasks and exit once all current tasks are finished: `celery multi stopwait querybook_worker@%h -A tasks.all_tasks --pidfile=/opt/celery_%n.pid`. This will make deployment time take much longer but users' running queries won't be killed.
