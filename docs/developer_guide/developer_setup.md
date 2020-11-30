---
id: developer_setup
title: Developer Setup
sidebar_label: Developer Setup
---

Here is how to setup dev tools before contributing to DataHub

## Setup Local DevTools

THIS PART IS IMPORTANT! This is required so that pre-commit hook can be used correctly.

```sh
git clone ...

cd ../
python3 -m venv .dhvenv
source .dhvenv/bin/activate

cd -
pip install -r requirements.txt
pre-commit install
yarn install
```

## Running the frontend locally via webpack-dev-server

Run the following command

```sh
yarn dev --env.DATAHUB_UPSTREAM=(Put your backend api server url here)
```

If you want to bypass cookie of upsteam do this

```sh
yarn dev --env.DATAHUB_UPSTREAM=(Put your backend api server url here) --env.DATAHUB_COOKIE=(Put backend api cookie here)
```
