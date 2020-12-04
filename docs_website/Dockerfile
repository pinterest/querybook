FROM node:14

WORKDIR /opt/docs_website
COPY docs_website/package.json .
COPY docs_website/yarn.lock .
RUN yarn install
COPY docs_website/ /opt/docs_website
COPY docs /opt/docs
RUN yarn run build

ENTRYPOINT yarn run docusaurus serve --build --port ${PORT} --host 0.0.0.0
