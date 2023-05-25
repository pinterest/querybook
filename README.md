# Justis

# Getting started

## Prerequisite

Please install Docker before trying out Querybook.

## Quick setup

Pull the repo..
First,
```
git remote add sfgov <repo>
```
then,
```
git pull sfgov dev
```
& then setup venv for our project..
(first check if exists then skip the steps)
```
ls | grep venv
```
if not exists (setup python environment)
(create encironment)
```
python3 -m venv venv
```
(activate environment)
```
source venv/bin/activate
```
last, we need to install requirements file
```
pip install -r requirements.txt
```

& then, start server
```
systemctl enable sfjustis_backend.service
systemctl start sfjustis_backend.service
```

(do after activate python environment)
and run `gunicorn --bind 0.0.0.0:5000 wsgi:app -m 007` or `python wsgi.py`. Visit https://localhost:5000 when the server up.


## Configuration


# User Interface
