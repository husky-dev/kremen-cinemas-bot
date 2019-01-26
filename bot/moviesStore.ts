import { projectKey, sadd, sismember, srem } from './redis';
const rootKey = `${projectKey}:movies`;

export const addToNotified = async (movies: string[]) => (
  sadd(`${rootKey}:notified`, ...movies)
);

export const removeFromNotified = async (movies: string) => (
  srem(`${rootKey}:notified`, movies)
);

export const isNotified = (movies: string) => (
  sismember(`${rootKey}:notified`, movies)
);

export const filterNotNotified = async (movies: string[]): Promise<string[]> => {
  const notNotified: string[] = [];
  for (const movie of movies) {
    const isMovieNotified = await isNotified(movie);
    if (!isMovieNotified) {
      notNotified.push(movie);
    }
  }
  return notNotified;
};
