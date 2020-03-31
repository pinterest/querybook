FROM node:lts

WORKDIR /app/website

EXPOSE 10001 35729
COPY ./docs /app/docs
COPY ./docs_website /app/website
RUN yarn install

CMD yarn run start --port 10001
