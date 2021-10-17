FROM node:17

WORKDIR /usr/src/app

RUN npm update \
    && npm i -g npm \
    && npm i -g sequelize-cli \
    && npm i -g autocannon \
    && rm -rf /var/lib/apt/lists/*
