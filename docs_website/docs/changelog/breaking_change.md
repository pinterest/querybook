---
id: breaking_changes
title: Breaking Changes
sidebar_label: Breaking Changes
slug: /changelog
---

Here are the list of breaking changes that you should be aware of when updating Querybook:

## v2.8.0

Result store plugin change. Now BaseReader::get_download_url requires a custom_name field to rename the download file. You only need to add the `custom_name=None` in the parameters for it to work.
