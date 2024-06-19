FROM node:20.9-alpine

WORKDIR /app

COPY . .

ENV NODE_ENV=production

# install packages and set the timezone
ENV TZ=Africa/Lagos

RUN apk add --no-cache tzdata \
    && cp /usr/share/zoneinfo/$TZ /etc/localtime \
    && echo $TZ > /etc/timezone

RUN npm install -g @nestjs/cli

RUN npm install
RUN npm run build

CMD npm run start:prod