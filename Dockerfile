# Cannot upgrade to Python 3.10 until the following uWSGI release a new version:
# https://github.com/unbit/uwsgi/pull/2363
# This caused websocket to fail
FROM python:3.9.16

ARG PRODUCTION=true
ARG EXTRA_PIP_INSTALLS=""

## Install Querybook package requirements + NodeJS
# Installing build-essential and python-dev for uwsgi
RUN mkdir -p /etc/apt/keyrings && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_18.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install --no-install-recommends -y --allow-downgrades --allow-remove-essential --allow-change-held-packages \
    libsasl2-dev \
    libsasl2-modules \
    build-essential \
    libssl-dev \
    libldap2-dev \
    nodejs \
    && apt-get clean

# Install YARN
RUN npm i -g npm@8.5.0 \
    && npm i -g yarn@^1.22.10 \
    && npm explore npm --global -- npm install node-gyp@9.0.0 \
    && yarn config set cache-folder /mnt/yarn-cache/cache \
    && yarn config set yarn-offline-mirror /mnt/yarn-offline-mirror

WORKDIR /opt/querybook

COPY requirements requirements/
RUN pip install -r requirements/base.txt \
    && if [ "${PRODUCTION}" = "true" ] ; then \
    pip install -r requirements/prod.txt; \
    fi \
    && if  [ -n "$EXTRA_PIP_INSTALLS" ] ; then \
    for PACKAGE in $(echo $EXTRA_PIP_INSTALLS | sed "s/,/ /g") ; do \
    pip install -r requirements/${PACKAGE}; \
    done \
    fi \
    && if [ -f requirements/local.txt ]; then \
    pip install -r requirements/local.txt; \
    fi

COPY package.json yarn.lock ./
RUN yarn install --pure-lockfile

# Copy everything else
COPY . .

# Copy change log images
COPY docs_website/static/changelog/ querybook/static/changelog/

# Webpack if prod
RUN if [ "${PRODUCTION}" = "true" ] ; then ./node_modules/.bin/webpack --mode=production; fi

# Environment variables, override plugins path for customization
ENV QUERYBOOK_PLUGIN=/opt/querybook/plugins
ENV PYTHONPATH=/opt/querybook/querybook/server:/opt/querybook/plugins
ENV production=${PRODUCTION}
