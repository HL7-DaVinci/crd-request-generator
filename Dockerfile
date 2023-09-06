FROM node:14-alpine
WORKDIR /home/node/app/request-generator
COPY --chown=node:node . .
RUN npm install
COPY --chown=node:node . .
EXPOSE 3000
CMD npm run start
