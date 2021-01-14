This is an example of setting up Querybook on a K8s cluster. It has been tested to work on DigitalOcean.

The setup is modified from docker-compose and runs in production mode.

Here are a few things to note **before** you use this:

-   **Do not use this for production!** Please host elasticsearch/sqldb/redis independently and pass their connection details via secrets.
-   The docker file for Querybook cannot be pulled because GitHub does not allow public docker pull. Please provide your own github authentication or change it to your custom docker build. Querybook's Docker Image will be moved to DockerHub once the source code is public.
