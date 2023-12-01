FROM node:18

WORKDIR /opt/docs_website
COPY docs_website/package.json docs_website/yarn.lock /opt/docs_website/
RUN yarn install
COPY docs_website/ /opt/docs_website
RUN yarn build

ENTRYPOINT yarn run docusaurus serve --build --port ${PORT} --host 0.0.0.0
