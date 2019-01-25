import { Log } from 'utils';
import { projectKey, redisClient } from './redis';
import { TGChatId } from './telegramBot';
const rootKey = `${projectKey}:admins`;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
const log = Log('admin');

export const isAdmin = async (chatId: TGChatId) => (
  new Promise((resolve, reject) => {
    if (!ADMIN_TOKEN) { return resolve(false); }
    redisClient.sismember(rootKey, `${chatId}`, (err, res) => (
      err ? reject(err) : resolve(res ? true : false)
    ));
  })
);

export const adminLogin = async (chatId: TGChatId, token: string) => (
  new Promise((resolve, reject) => {
    if (!ADMIN_TOKEN) {
      log.warn(`trying to login without ADMIN_TOKEN provided`);
      return resolve(false);
    }
    if (token !== ADMIN_TOKEN) { return resolve(false); }
    redisClient.sadd(rootKey, `${chatId}`, (err) => (
      err ? reject(err) : resolve(true)
    ));
  })
);

export const adminLogout = async (chatId: TGChatId) => new Promise((resolve, reject) => {
  redisClient.srem(rootKey, `${chatId}`, (err, res) => (
    err ? reject(err) : resolve(res ? true : false)
  ));
});

export const getAdminChats = async (): Promise<string[]> => (
  new Promise((resolve, reject) => {
    redisClient.smembers(rootKey, (err, res) => (
      err ? reject(err) : resolve(res)
    ));
  })
);
