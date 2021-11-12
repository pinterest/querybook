FROM python:3.7.9
ARG PRODUCTION=true

## Install Querybook package requirements + NodeJS
# Installing build-essential and python-dev for uwsgi
RUN rm -rf /var/lib/apt/lists/* \
    && apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install --no-install-recommends -y --allow-downgrades --allow-remove-essential --allow-change-held-packages \
    libsasl2-dev \
    libsasl2-modules \
    build-essential \
    python-dev \
    libssl-dev \
    libldap2-dev \
    && curl -sL https://deb.nodesource.com/setup_14.x |  bash - \
    && DEBIAN_FRONTEND=noninteractive apt-get install --no-install-recommends -y --allow-downgrades --allow-remove-essential --allow-change-held-packages \
    nodejs \
    && apt-get clean

# Install YARN
RUN npm i -g npm@6.14.5 \
    && npm i -g yarn@^1.22 \
    && npm explore npm --global -- npm install node-gyp@7.0.0 \
    && yarn config set cache-folder /mnt/yarn-cache/cache \
    && yarn config set yarn-offline-mirror /mnt/yarn-offline-mirror

# Install OpenJDK-11
RUN apt-get update && \
    apt-get install --assume-yes openjdk-11-jre-headless && \
    apt-get clean;

WORKDIR /opt/querybook

COPY requirements requirements/
RUN pip install -r requirements/base.txt \
    && if [ "${PRODUCTION}" = "true" ] ; then \
    pip install -r requirements/prod.txt; \
    else \
    pip install -r requirements/dev.txt; \
    fi \
    && pip install -r requirements/local.txt || true

COPY package.json yarn.lock ./
RUN yarn install --pure-lockfile && npm rebuild node-sass

# Copy everything else
COPY . .

RUN wget -P /opt/querybook/ https://github.com/forcedotcom/Salesforce-CDP-jdbc/releases/download/release_2021.10A/Salesforce-CDP-jdbc-1.10.0-java8.jar

# Webpack if prod
RUN if [ "${PRODUCTION}" = "true" ] ; then ./node_modules/.bin/webpack --mode=production; fi

# Environment variables, override plugins path for customization
ENV QUERYBOOK_PLUGIN=/opt/querybook/plugins
ENV PYTHONPATH=/opt/querybook/querybook/server:/opt/querybook/plugins
ENV production=${PRODUCTION}
