FROM node:20.9-alpine

WORKDIR /app

COPY . .

ENV NODE_ENV production

RUN npm install -g @nestjs/cli

RUN npm install
RUN npm run build

CMD npm run start:prod