FROM nginx:alpine

RUN apk update && apk add bash

EXPOSE 8000

COPY nginx.conf /nginx.conf.template

CMD ["/bin/sh", "-c", "envsubst '$FRONTEND_SERVICE $BACKEND_SERVICE' < /nginx.conf.template > /etc/nginx/nginx.conf && exec nginx -g 'daemon off;'"] 