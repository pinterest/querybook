FROM python:3.7.4

## Install DataHub package requirements + NodeJS
# Installing build-essential and python-dev for uwsgi
RUN rm -rf /var/lib/apt/lists/* \
    && apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install --no-install-recommends -y --force-yes \
    libsasl2-dev \
    libsasl2-modules \
    build-essential \
    python-dev \
    libssl-dev \
    && curl -sL https://deb.nodesource.com/setup_12.x |  bash - \
    && DEBIAN_FRONTEND=noninteractive apt-get install --no-install-recommends -y --force-yes \
    nodejs \
    && apt-get clean

# Install YARN
RUN npm i -g npm@6.1.0 \
    && npm i -g yarn@^1.7 \
    && npm explore npm --global -- npm install node-gyp@3.6.2 \
    && yarn config set cache-folder /mnt/yarn-cache/cache \
    && yarn config set yarn-offline-mirror /mnt/yarn-offline-mirror

WORKDIR /opt/datahub

COPY requirements requirements/
RUN pip install -r requirements/base.txt && pip install -r requirements/prod.txt

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --pure-lockfile && npm rebuild node-sass


# Copy everything else
COPY . .

# Webpack
RUN ./node_modules/.bin/webpack --env.NODE_ENV=production

# Environment variables, override plugins path for customization
ENV DATAHUB_PLUGIN=/opt/datahub/plugins
ENV PYTHONPATH=/opt/datahub/datahub/server:/opt/datahub/plugins
ENV production=true