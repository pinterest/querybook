---
id: quick_setup
title: Quick Setup
sidebar_label: Quick Setup
---

## Prerequisite

### Main requirement:

[Docker](https://www.docker.com/) needs to be installed for quick setup.

### System requirements:

-   5GB of free RAM (10GB for Windows WSL)
-   5GB of disk space

### Kernel Config

#### Linux

Run `sudo sysctl -w vm.max_map_count=262144` to ensure [ElasticSearch](https://www.elastic.co/guide/en/elasticsearch/reference/current/vm-max-map-count.html) works.

#### Mac

Go to the `Docker Desktop` app -> top right gear icon -> Preferences -> Resources -> Advanced. Make sure your memory limit per app is >= 3GB.

#### Windows

Please install WSL 2 as instructed [here](https://docs.microsoft.com/en-us/windows/wsl/install-win10). Now go to Docker Desktop, Settings > General, and check the box "Use the WSL 2 based Engine".

Launch WSL shell and run `sudo sysctl -w vm.max_map_count=262144` to ensure [ElasticSearch](https://www.elastic.co/guide/en/elasticsearch/reference/current/vm-max-map-count.html) works.

## Getting Started

Open your terminal, and run:

```sh
git clone https://github.com/pinterest/querybook.git
```

Now run the following

```sh
make
```

That's it! 🎉

You can now access it on [http://localhost:10001](http://localhost:10001).

Check out the [general configuration guide](../configurations/general_config.md) for more detailed info about what can be configured in the Querybook Admin UI.

If the command did not work, checkout [Troubleshoot](troubleshoot.md).
