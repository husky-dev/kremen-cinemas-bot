// Require
const _ = require('lodash');
const { client, projectKey } = require('./redis');
// Consts
const rootKey = `${projectKey}:cache`;
// Log
const log = require('./log').withModule('cache');

// Cache

const setCache = (recKey, value, expire) => new Promise((resolve, reject) => {
  const key = `${rootKey}:${recKey}`;
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

const getCache = (recKey) => new Promise((resolve, reject) => {
  const key = `${rootKey}:${recKey}`;
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
