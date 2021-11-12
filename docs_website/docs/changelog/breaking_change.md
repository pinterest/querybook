---
id: breaking_changes
title: Breaking Changes
sidebar_label: Breaking Changes
slug: /changelog
---

Here are the list of breaking changes that you should be aware of when updating Querybook:

## v2.9.0

Now announcements have two extra fields - `active_from` and `active_till`. These fields are not required and a user can still create an announcement without these two fields and if an announcement has two one these fields and the date in these fields are not in the range, this announcement will be filtered.

## v2.8.0

Result store plugin change. Now BaseReader::get_download_url requires a custom_name field to rename the download file. You only need to add the `custom_name=None` in the parameters for it to work.
