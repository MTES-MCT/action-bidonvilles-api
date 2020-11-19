# ====
# Development
# ====
FROM node:15.1 AS development

RUN mkdir /home/node/app/ && chown node:node /home/node/app/

USER node

WORKDIR /home/node/app/

COPY --chown=node:node package.json yarn.lock ./
RUN yarn install --silent && yarn cache clean