'use strict';

const redis = require('redis');
const { REDIS_HOST, REDIS_PORT, REDIS_PASS } = process.env;
const client = redis.createClient({
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASS,
});
const log = require('./log');
const projectKey = 'cinema';

client.on('error', (err) => {
  log.err(err);
});

module.exports = {
  client, projectKey,
};
