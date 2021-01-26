---
id: quick_setup
title: Quick Setup
sidebar_label: Quick Setup
---

## Prerequisite

### Main requirement:

[Docker](https://www.docker.com/) needs to be installed for quick setup.

### System requirements:

-   3GB of additional RAM
-   5GB of disk space

### Kernel Config

#### Linux

Run `sudo sysctl -w vm.max_map_count=262144` to ensure [ElasticSearch](https://www.elastic.co/guide/en/elasticsearch/reference/current/vm-max-map-count.html) works.

## Getting Started

After cloning the repo, run the following

```sh
make
```

That's it! 🎉

You can now access it on [http://localhost:10001](http://localhost:10001).

Check out the [general configuration guide](../configurations/general_config.md) for more detailed info about what can be configured in the Querybook Admin UI.

If the command did not work, checkout [Troubleshoot](troubleshoot.md).
