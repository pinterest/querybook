---
id: troubleshoot
title: Troubleshoot
sidebar_label: Troubleshoot
---

Please run migrations when makeing changes to sqlalchemy schema definitions

### Elasticsearch connection error:

If datadocs are not showing up in search results and
if when you run `make` you get the following message in the bash console:

```
elasticsearch    | [2019-03-27T20:35:00,273][INFO ][o.e.x.m.p.NativeController] [kcqBkjB] Native controller process has stopped - no new native processes can be started
```

Simply run `sudo sysctl -w vm.max_map_count=262144` in your machine, outside Docker, and run `make` again.
(We'll add an automatic check for this).

### Error: Source file "/...path to datahub.../datahub/.arcanist/**phutil_library_init**.php" failed to load.

**Solution:** Run the following commands:

```
git submodule update --init
yarn install
```
