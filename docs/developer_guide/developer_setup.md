---
id: developer_setup
title: Developer Setup
sidebar_label: Developer Setup
---

Here is how to setup dev tools before contributing to DataHub

## Setup Local DevTools

```
git clone ...

cd ../
virtualenv .dhvenv
source .dhvenv/bin/activate

cd -
pip install -r requirements.txt

git submodule update --init
yarn install
```

## Running the frontend locally via webpack-dev-server

Run the following command

```
yarn dev --env.DATAHUB_UPSTREAM=(Put your backend api server url here)
```

If you want to bypass cookie of upsteam do this

```
yarn dev --env.DATAHUB_UPSTREAM=(Put your backend api server url here) --env.DATAHUB_COOKIE=(Put backend api cookie here)
```
