// Require
const _ = require('lodash');
const redis = require("redis");
const client = redis.createClient({host: 'redis'});
// Log
const log = require('../common/log.js').withModule('redis');

// Errors catching
client.on("error", (err) => {
  log.err(err);
});

// Cache

const setCache = (key, value, expire) => new Promise((resolve, reject) => {
  let data = null;
  try{
    data = JSON.stringify(value);
  }catch(err){
    return log.err(`setting cache error: ${err.toString()}`);
  }
  if(expire && _.isNumber(expire)){
    client.set(key, data, 'EX', expire, (err, reply) => (
      err ? reject(err) : resolve(reply)
    ));
  }else{
    client.set(key, data, (err, reply) => (
      err ? reject(err) : resolve(reply)
    ));
  }
});

const getCache = (key) => new Promise((resolve, reject) => {
  client.get(key, (err, reply) => {
    if(err){
      log.err(`getting cache error: ${err.toString()}`);
      reject(err);
    }else{
      if(!reply) return resolve(null);
      let data = null;
      try{
        data = JSON.parse(reply);
      }catch(parsErr){
        log.err(`parsing cache error: ${parsErr.toString()}`);
        reject(parsErr);
      }
      resolve(data);
    }
  });
});

// Exports
module.exports = {
  setCache,
  getCache,
}
