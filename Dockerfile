FROM node:14-alpine
WORKDIR /home/node/app
COPY --chown=node:node . .
RUN npm install
RUN npm run build
EXPOSE 3000
CMD npm run start
