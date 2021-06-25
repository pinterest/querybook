---
id: contributing
title: Contributing
sidebar_label: Contributing
---

First off, thanks for taking the time to contribute! This guide will answer
some common questions about how this project works.

While this is a Pinterest open source project, we welcome contributions from
everyone.

## Code of Conduct

Please be sure to read and understand our [CODE_OF_CONDUCT.md](https://github.com/pinterest/querybook/blob/master/CODE_OF_CONDUCT.md).
We work hard to ensure that our projects are welcoming and inclusive to as many
people as possible.

## Reporting Issues

If you have a bug report, please provide as much information as possible so that
we can help you out:

-   Version of the project you're using.
-   Code (or even better whole projects) which reproduce the issue.
-   Steps which reproduce the issue.
-   Screenshots, GIFs or videos (if relavent).
-   Stack traces for crashes.
-   Any logs produced.

## Fixing Bugs

We welcome and appreciate anyone for fixing bugs!

-   You can fix bugs as per "Making Changes" and send for code review!

## Adding New Features

We welcome and appreciate anyone for adding new features for Querybook!
Following is the current process:

-   Please create a GitHub issue proposing your new feature, including what and why. It can be brief, one or two paragraphs is ok.
-   The project maintainers will then approve the new feature proposal.
-   You can then briefly describe your intended technical design for the new feature.
-   The project maintainers will then approve the technical design and/or request changes.
-   Then you can implement the new feature as per "Making Changes" and send for code review!

## Making Changes

Please first check "Fixing Bugs" or "Adding New Features" as appropriate.

1. Create a new branch off of master. (We can't currently enable forking while the repo is in private beta)
2. Make your changes and verify that tests pass
3. Commit your work and push to origin your new branch
4. Submit a pull request to merge to master
5. Ensure your code passes both linter and unit tests
6. Participate in the code review process by responding to feedback

Once there is agreement that the code is in good shape, one of the project's
maintainers will merge your contribution.

To increase the chances that your pull request will be accepted:

-   Follow the coding style
-   Write tests for your changes
-   Write a good commit message

### Pull Request Format

When you create a new pull request, please make sure it's title follows the specifications in https://www.conventionalcommits.org/en/v1.0.0/. This is to ensure automatic versioning.

Here are all the prefix allowed by Querybook:

-   **patch change**
    -   build: Any changes to webpack/pip/Docker
    -   ci: Changes related to github actions
    -   docs: Any change to documentation or documentation site
    -   ui: Minor UI changes that does not impact logic
    -   refactor: Code refactor/reorg that does not change logic
    -   test: Add/Update tests, changes to pytest/jest
    -   fix: Bug fix/Small tweaks
-   **minor change**
    -   feat: Major logic/interaction change, any db migrations
    -   minor
        -   Use this for large patch change
-   **major change**
    -   BREAKING CHANGE
        -   Imcompatible DB data/metadata change
        -   Plugins API change
    -   MAJOR

## Help

Start by reading the developer starter guide [this guide](./developer_setup.md) to setup Querybook/
If you're having trouble using this project, please go through the docs and search for solutions in the existing open and closed issues.

You can also reach out to us at querybook@pinterest.com or on our [Slack](https://join.slack.com/t/querybook/shared_invite/zt-se82lvld-yyzRIqvIASsyYozk7jMCYQ).

## Security

If you've found a security issue in one of our open source projects,
please report it at [Bugcrowd](https://bugcrowd.com/pinterest); you may even
make some money!

## License

By contributing to this project, you agree that your contributions will be
licensed under its [license](https://github.com/pinterest/querybook/blob/master/LICENSE).
