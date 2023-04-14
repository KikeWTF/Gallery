FROM node:latest AS build
WORKDIR /app
COPY . /app/
RUN npm install && npm run lint && npm run format && npm run build

FROM httpd:alpine
EXPOSE 80
COPY --from=build /app/www /usr/local/apache2/htdocs/