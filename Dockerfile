FROM node:22-alpine
WORKDIR /home/node/app/crd-request-generator
COPY --chown=node:node . .
RUN npm install
COPY --chown=node:node . .
ENV BROWSER=none
EXPOSE 3000
CMD ["npm", "start"]
