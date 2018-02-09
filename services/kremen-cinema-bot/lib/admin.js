// Require
const { client, projectKey } = require('./redis');
// Consts
const adminsKey = `${projectKey}:admins`;
const ACCESS_TOKEN = process.env.KREMEN_CINEMA_BOT_ADMIN;

// Functions

const isLogined = (chatId) => new Promise((resolve, reject) => {
  if(!ACCESS_TOKEN) return resolve(false);
  client.sismember(adminsKey, chatId, (err, res) => (
    err ? reject(err) : resolve(res ? true : false)
  ));
});

const login = (chatId, token) => new Promise((resolve, reject) => {
  if(!ACCESS_TOKEN){
    log.warn(`trying to login without ${KREMEN_CINEMA_BOT_ADMIN} provided`);
    return resolve(false);
  }
  if(token !== ACCESS_TOKEN) return resolve(false);
  client.sadd(adminsKey, chatId, (err) => (
    err ? reject(err) : resolve(true)
  ));
});

const logout = (chatId) => new Promise((resolve, reject) => {
  client.srem(adminsKey, chatId, (err, res) => (
    err ? reject(err) : resolve(res ? true : false)
  ));
});

// Exports
module.exports = {
  isLogined,
  login,
  logout,
}
