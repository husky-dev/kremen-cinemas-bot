FROM node:alpine

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/
COPY yarn.lock /usr/src/app/
RUN yarn install --production

# Bundle app source
COPY index.js /usr/src/app
COPY lib /usr/src/app/lib

EXPOSE 8080
CMD [ "yarn", "start" ]
