FROM python:3.7.7
ARG PRODUCTION=true

## Install DataHub package requirements + NodeJS
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

WORKDIR /opt/datahub

COPY requirements requirements/
RUN pip install -r requirements/base.txt \
    && if [ "${PRODUCTION}" = "true" ] ; then \
    pip install -r requirements/prod.txt; \
    else \
    pip install -r requirements/dev.txt; \
    fi

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --pure-lockfile && npm rebuild node-sass


# Copy everything else
COPY . .

# Webpack if prod
RUN if [ "${PRODUCTION}" = "true" ] ; then ./node_modules/.bin/webpack --env.NODE_ENV=production ; fi

# Environment variables, override plugins path for customization
ENV DATAHUB_PLUGIN=/opt/datahub/plugins
ENV PYTHONPATH=/opt/datahub/datahub/server:/opt/datahub/plugins
ENV production=${PRODUCTION}
