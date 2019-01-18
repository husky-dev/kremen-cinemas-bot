'use strict';

const { client, projectKey } = require('./redis');
const rootKey = `${projectKey}:admins`;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
const log = require('./log');

const isLogined = (chatId) => new Promise((resolve, reject) => {
  if(!ADMIN_TOKEN) return resolve(false);
  client.sismember(rootKey, chatId, (err, res) => (
    err ? reject(err) : resolve(res ? true : false)
  ));
});

const login = (chatId, token) => new Promise((resolve, reject) => {
  if(!ADMIN_TOKEN){
    log.warn(`trying to login without ADMIN_TOKEN provided`);
    return resolve(false);
  }
  if(token !== ADMIN_TOKEN) return resolve(false);
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

module.exports = {
  isLogined,
  getChats,
  login,
  logout,
}
