// Require
const { client, projectKey } = require('./redis');
// Consts
const rootKey = `${projectKey}:admins`;
const ACCESS_TOKEN = process.env.KREMEN_CINEMA_BOT_ADMIN;
// Log
const log = require('./log').withModule('admin');

// Functions

const isLogined = (chatId) => new Promise((resolve, reject) => {
  if(!ACCESS_TOKEN) return resolve(false);
  client.sismember(rootKey, chatId, (err, res) => (
    err ? reject(err) : resolve(res ? true : false)
  ));
});

const login = (chatId, token) => new Promise((resolve, reject) => {
  if(!ACCESS_TOKEN){
    log.warn(`trying to login without KREMEN_CINEMA_BOT_ADMIN provided`);
    return resolve(false);
  }
  if(token !== ACCESS_TOKEN) return resolve(false);
  client.sadd(rootKey, chatId, (err) => (
    err ? reject(err) : resolve(true)
  ));
});

const logout = (chatId) => new Promise((resolve, reject) => {
  client.srem(rootKey, chatId, (err, res) => (
    err ? reject(err) : resolve(res ? true : false)
  ));
});

const getChats = () => new Promise((resolve, reject) => {
  client.smembers(rootKey, (err, res) => (
    err ? reject(err) : resolve(res)
  ));
});

// Exports
module.exports = {
  isLogined,
  getChats,
  login,
  logout,
}
