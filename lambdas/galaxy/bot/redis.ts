
import redis from 'redis';
import { Log } from 'utils';
const log = Log('redis');
export const projectKey = 'cinemas';

export const redisClient = redis.createClient({
  host: 'redis-19865.c16.us-east-1-3.ec2.cloud.redislabs.com',
  password: 'REDISFjNxx7HZZ7ZpxjuNpWzOUNR9kFiIhizu_PASS',
  port: 19865,
});

redisClient.on('error', (err) => {
  log.err(err);
});
