// Require
const redis = require('redis');
// Log
const log = require('./log').withModule('redis');
// Redis
const client = redis.createClient({host: 'redis'});
// Consts
const projectKey = 'cinema';

// Errors catching
client.on('error', (err) => {
  log.err(err);
});

module.exports = {
  client,
  projectKey,
};
