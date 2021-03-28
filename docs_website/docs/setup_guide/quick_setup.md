---
id: quick_setup
title: Quick Setup
sidebar_label: Quick Setup
---

## Prerequisite

### Main requirement:

[Docker](https://www.docker.com/) needs to be installed for quick setup.

### System requirements:

-   Memory Requirements[^1]:
    -   Windows with WSL: 10GB of free memory
    -   Mac: 7GB of free memory
    -   Linux: 4GB of free memory
-   5GB of disk space

### Kernel Config

#### Linux

Run `sudo sysctl -w vm.max_map_count=262144` to ensure [ElasticSearch](https://www.elastic.co/guide/en/elasticsearch/reference/current/vm-max-map-count.html) works.

#### Mac

Go to the `Docker Desktop` app -> top right gear icon -> Resources -> Advanced. Make sure your memory limit per app is >= 5GB [^2].

#### Windows

Please install WSL 2 as instructed [here](https://docs.microsoft.com/en-us/windows/wsl/install-win10). Now go to Docker Desktop, Settings > General, and check the box "Use the WSL 2 based Engine".

Launch WSL shell and run `sudo sysctl -w vm.max_map_count=262144` to ensure [ElasticSearch](https://www.elastic.co/guide/en/elasticsearch/reference/current/vm-max-map-count.html) works.

## Getting Started

Open your terminal, and run:

```sh
git clone https://github.com/pinterest/querybook.git
cd querybook
```

Now run the following

```sh
make
```

That's it! 🎉

You can now access it on [http://localhost:10001](http://localhost:10001).

Check out the [general configuration guide](../configurations/general_config.md) for more detailed info about what can be configured in the Querybook Admin UI.

If the command did not work, checkout [Troubleshoot](troubleshoot.md).

[^1]: Tested on 16GB/64GB Mac & 32GB Windows/Ubuntu.
[^2]: Total container memory usage should not exceed 2GB, this is only needed because Elasticsearch has a high peak memory at the start.
