FROM node:11-alpine

WORKDIR /usr/src/app

ARG NODE_ENV=production

ENV PATH /usr/src/app/node_modules/.bin:$PATH

COPY package.json package.json
RUN npm install --silent
COPY . .
EXPOSE 3001

CMD ["npm", "start"]