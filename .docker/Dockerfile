# build stage
FROM node:22.4.1-alpine AS build-stage

RUN apk update && \
    apk --no-cache add \
    vim \
    nano \
    git \
    bash

RUN rm -rf /var/cache/apk/*

WORKDIR /app

COPY ./ .

RUN npm install

RUN npm run build

RUN rm -r $(ls -A | grep -v dist)

# production stage
FROM nginx AS production-stage

RUN apt-get update \
    && apt-get -y install vim

RUN mkdir /app

COPY --from=build-stage /app/dist /app
COPY ./.docker/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
