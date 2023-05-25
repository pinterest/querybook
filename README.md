# Justis

# Getting started

## Quick setup
## Backend Config

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
and run `gunicorn --bind 0.0.0.0:5000 wsgi:app -m 007` or `python wsgi.py`.
Visit https://localhost:5000 when the server up.


## Frontend Config

Pull the repo..
First,
```
git remote add sfgov <repo>
```
then,
```
git pull sfgov main
```
& then setup venv for our project..
```
npm i
```
& then, start server
```
systemctl enable sfjustis_frontend.service
systemctl start sfjustis_frontend.service
```

(do after activate python environment)
and run `npm start`.
Visit https://localhost:3000 when the server up.

# PS
Everytime you do `git pull`.. restart service

# Backend
```
systemctl restart sfjustis_backend.service
```

# Frontend
```
systemctl restart sfjustis_frontend.service
```
