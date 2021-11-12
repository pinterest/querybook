This is an example of setting up Querybook on a K8s cluster. It has been tested to work on DigitalOcean.

The setup is modified from docker-compose and runs in production mode.

Here are a few things to note **before** you use this:

-   **Do not use this for production!** Please host elasticsearch/sqldb/redis independently and pass their connection details via secrets.
