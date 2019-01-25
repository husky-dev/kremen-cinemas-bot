import { projectKey, redisClient } from './redis';
const rootKey = `${projectKey}:movies`;

const addToNotified = (movies) => new Promise((resolve, reject) => {
  redisClient.sadd(`${rootKey}:notified`, movies, (err) => (
    err ? reject(err) : resolve()
  ));
});

const removeFromNotified = (movies) => new Promise((resolve, reject) => {
  redisClient.srem(`${rootKey}:notified`, movies, (err) => (
    err ? reject(err) : resolve()
  ));
});

const isNotified = (movies) => new Promise((resolve, reject) => {
  redisClient.sismember(`${rootKey}:notified`, movies, (err, res) => (
    err ? reject(err) : resolve(res ? true : false)
  ));
});

const filterNotNotified = async (movies) => {
  const notNotified = [];
  for (const movie of movies) {
    const isMovieNotified = await isNotified(movie);
    if (!isMovieNotified) {
      notNotified.push(movie);
    }
  }
  return notNotified;
};

export default {
  addToNotified,
  removeFromNotified,
  isNotified,
  filterNotNotified,
};
