
import redis from 'redis';
import { Log } from 'utils';
const log = Log('redis');
export const projectKey = 'cinemas';

export const redisClient = redis.createClient({
  host: 'redis-19865.c16.us-east-1-3.ec2.cloud.redislabs.com',
  password: 'FjNxx7HZZ7ZpxjuNpWzOUNR9kFiIhizu',
  port: 19865,
});

// Sets

export const sadd = async (key: string, ...val: string[]) => (
  new Promise((resolve, reject) => (
    redisClient.sadd(key, val, (err, res) => (
      err ? reject(err) : resolve(res)
    ))
  ))
);

export const smembers = async (key: string) => (
  new Promise<string[]>((resolve, reject) => (
    redisClient.smembers(key, (err, res) => (
      err ? reject(err) : resolve(res)
    ))
  ))
);

export const srem = async (key: string, ...val: string[]) => (
  new Promise<number>((resolve, reject) => (
    redisClient.srem(key, val, (err, res) => (
      err ? reject(err) : resolve(res)
    ))
  ))
);

export const sismember = async (key: string, val: string) => (
  new Promise<boolean>((resolve, reject) => (
    redisClient.sismember(key, val, (err, res) => (
      err ? reject(err) : resolve(res ? true : false)
    ))
  ))
);

export const sdiff = async (keyA: string, keyB: string) => (
  new Promise<string[]>((resolve, reject) => (
    redisClient.sdiff(keyA, keyB, (err, res) => (
      err ? reject(err) : resolve(res)
    ))
  ))
);

// Default err processor

redisClient.on('error', (err) => {
  log.err(err);
});