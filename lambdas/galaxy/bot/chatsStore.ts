import { projectKey, redisClient } from './redis';
const rootKey = `${projectKey}:chats`;

const add = (chatId) => addToGroup(chatId, 'all');
const get = () => getGroup('all');

const addToGroup = (chatId, group) => new Promise((resolve, reject) => {
  redisClient.sadd(`${rootKey}:${group}`, chatId, (err) => (
    err ? reject(err) : resolve(true)
  ));
});

const removeFromGroup = (chatId, group) => new Promise((resolve, reject) => {
  redisClient.srem(`${rootKey}:${group}`, chatId, (err) => (
    err ? reject(err) : resolve(true)
  ));
});

const getGroup = (group) => new Promise((resolve, reject) => {
  redisClient.smembers(`${rootKey}:${group}`, (err, res) => (
    err ? reject(err) : resolve(res)
  ));
});

const getNotInGroup = (group) => new Promise((resolve, reject) => {
  const allKey = `${rootKey}:all`;
  const groupKey = `${rootKey}:${group}`;
  redisClient.sdiff(allKey, groupKey, (err, res) => (
    err ? reject(err) : resolve(res)
  ));
});

export default {
  add,
  addToGroup,
  get,
  getGroup,
  getNotInGroup,
  removeFromGroup,
};
