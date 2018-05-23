FROM node:alpine

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Copy wait-for
COPY wait-for /wait-for
RUN chmod +x /wait-for

# Install app dependencies
COPY package.json /usr/src/app/
COPY yarn.lock /usr/src/app/
RUN yarn install --production

# Bundle app source
COPY index.js /usr/src/app
COPY lib /usr/src/app/lib

CMD ["/wait-for", "redis:6379", "--", "yarn", "start" ]
