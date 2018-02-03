// Require
const _ = require('lodash');
const redis = require("redis");
const client = redis.createClient({host: 'redis'});
// Consts
const rootKey = 'stats:kcbot';
// Log
const log = require('../common/log.js').withModule('stats');

// Errors catching
client.on("error", (err) => {
  log.err(err);
});

// Cache

const logEvent = (eventName) => new Promise((resolve, reject) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const hours = now.getHours();
  const key = `${rootKey}:events:${eventName}:${year}:${month}:${day}:${hours}`;
  client.incr(key, (err, reply) => (
    err ? reject(err) : resolve(reply)
  ));
});

// Exports
module.exports = {
  logEvent,
}
