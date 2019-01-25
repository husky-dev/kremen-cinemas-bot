import { projectKey, redisClient } from './redis';
import { TGChatId } from './telegramBot';
const rootKey = `${projectKey}:chats`;

export const addToAllGroup = (chatId: TGChatId) => addToGroup(chatId, 'all');
export const removeFromAllGroup = (chatId: TGChatId) => removeFromGroup(chatId, 'all');
export const getAllGroup = () => getGroup('all');

export const addToGroup = async (chatId: TGChatId, group: string) => (
  new Promise((resolve, reject) => {
    redisClient.sadd(`${rootKey}:${group}`, `${chatId}`, (err) => (
      err ? reject(err) : resolve()
    ));
  })
);

export const removeFromGroup = async (chatId: TGChatId, group: string) => (
  new Promise((resolve, reject) => {
    redisClient.srem(`${rootKey}:${group}`, `${chatId}`, (err) => (
      err ? reject(err) : resolve()
    ));
  })
);

export const getGroup = async (group: string): Promise<string[]> => (
  new Promise((resolve, reject) => {
    redisClient.smembers(`${rootKey}:${group}`, (err, res) => (
      err ? reject(err) : resolve(res)
    ));
  })
);

export const getNotInGroup = async (group: string): Promise<string[]> => (
  new Promise((resolve, reject) => {
    const allKey = `${rootKey}:all`;
    const groupKey = `${rootKey}:${group}`;
    redisClient.sdiff(allKey, groupKey, (err, res) => (
      err ? reject(err) : resolve(res)
    ));
  })
);
