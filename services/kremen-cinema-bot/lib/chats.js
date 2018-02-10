// Require
const _ = require('lodash');
const { client, projectKey } = require('./redis');
// Consts
const rootKey = `${projectKey}:chats`;

const add = (chatId) => addToGroup(chatId, 'all');
const remove = (chatId) => removeFromGroup(chatId, 'all');
const get = () => getGroup('all');

const addToGroup = (chatId, group) => new Promise((resolve, reject) => {
  client.sadd(`${projectKey}:${group}`, chatId, (err) => (
    err ? reject(err) : resolve(true)
  ));
});

const removeFromGroup = (chatId, group) => new Promise((resolve, reject) => {
  client.srem(`${projectKey}:${group}`, chatId, (err) => (
    err ? reject(err) : resolve(true)
  ));
});

const getGroup = (group) => new Promise((resolve, reject) => {
  client.smembers(`${projectKey}:${group}`, (err, res) => (
    err ? reject(err) : resolve(res)
  ));
});

const getNotInGroup = (group) => new Promise((resolve, reject) => {
  const allKey = `${projectKey}:all`;
  const groupKey = `${projectKey}:${group}`;
  client.sdiff(allKey, groupKey, (err, res) => (
    err ? reject(err) : resolve(res)
  ));
});

// Exports
module.exports = {
  add,
  addToGroup,
  get,
  getGroup,
  getNotInGroup,
  removeFromGroup,
}
