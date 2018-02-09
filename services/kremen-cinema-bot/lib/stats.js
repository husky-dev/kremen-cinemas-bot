// Require
const _ = require('lodash');
const { client, projectKey } = require('./redis');
// Consts
const rootKey = `${projectKey}:stats`;
// Log
const log = require('./log').withModule('stats');

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
