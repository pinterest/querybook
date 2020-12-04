FROM node:14

WORKDIR /opt/docs_website
COPY docs_website/package.json .
COPY docs_website/yarn.lock .
RUN yarn install
COPY docs_website/ /opt/docs_website
COPY docs /opt/docs

ENTRYPOINT yarn start --port ${PORT}
