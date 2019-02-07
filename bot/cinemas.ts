import { ICinema, ICinemaSession } from 'common/types';
import { compact, reduce, sortBy, uniq } from 'lodash';
import { Log, RN, RN2 } from 'utils';
import { getDataBodyFromLambda } from 'utils/lambda';
const log = Log('cinemas');
const { env: { NODE_ENV } } = process;

const cinemaDataProviders = [
  `kremen-cinema-${NODE_ENV}-cinemas`,
];

const getCinemaDataFromProvider = async (FunctionName: string): Promise<ICinema> => {
  log.debug(`get cinema data from provider: ${FunctionName}`);
  return getDataBodyFromLambda({ FunctionName });
};

export const getCinemasData = async () => {
  const cinemas: ICinema[] = [];
  for (const provider of cinemaDataProviders) {
    try {
      const data = await getCinemaDataFromProvider(provider);
      cinemas.push(data);
    } catch (err) {
      log.err(err);
    }
  }
  return cinemas;
};

export const moviesListFromCinemasData = (cinemas: ICinema[]): string[] => {
  const res: string[] = [];
  for (const cinema of cinemas) {
    for (const movie of cinema.movies) {
      res.push(movie.title);
    }
  }
  return uniq(res);
};

const moviePriorityFromCinemas = (title: string, cinemas: ICinema[]): number => {
  let sessionsCount = 0;
  for (const cinema of cinemas) {
    const movie = cinema.movies.find((item) => item.title === title);
    if (movie) {
      sessionsCount += movie.sessions.length;
    }
  }
  return sessionsCount;
};

// Text

interface IMoviesMsg {
  priority: number;
  msg: string;
}

export const cinemsDataToMsg = (cinemas: ICinema[]): string => {
  const titles = moviesListFromCinemasData(cinemas);
  const moviesMsg: IMoviesMsg[] = [];
  for (const title of titles) {
    const msg = getMovieMsg(title, cinemas);
    if (msg) {
      const priority = moviePriorityFromCinemas(title, cinemas);
      moviesMsg.push({msg, priority});
    }
  }
  const sortMoviesMsg = sortBy(moviesMsg, ({priority}) => -priority);
  return reduce(sortMoviesMsg, (memo, {msg}) => (
    memo ? `${memo}${RN2}${msg}` : msg
  ), '');
};

const getMovieMsg = (title: string, cinemas: ICinema[]): string | null => {
  if (!title) { return null; }
  let str = `🍿 *${title}*`;
  for (const cinema of cinemas) {
    const cStr = cinemaToMovieMsg(title, cinema);
    if (cStr) { str = `${str}${RN2}${cStr}`; }
  }
  return str;
};

const cinemaToMovieMsg = (title: string, cinema: ICinema): string | null => {
  const { title: cTitle, movies: cMovies } = cinema;
  const movie = cMovies.find((item) => item.title === title);
  if (!movie) { return null; }
  const { sessions } = movie;
  const str = sessionToStr(sessions);
  if (!str) { return null; }
  const formats = sessionsToFormatStr(sessions);
  return !formats ? `🎥 ${cTitle}${RN}${str}` : `🎥 ${cTitle} (${formats})${RN}${str}`;
};

const sessionsToFormatStr = (sessions: ICinemaSession[]): string | null => {
  if (!sessions.length) { return null; }
  const formats = uniq(compact(sessions.map((item) => (item.format ? item.format.toUpperCase() : item.format))));
  if (!formats.length) { return null; }
  const sortFormats = formats.sort((a, b) => a > b ? 1 : -1);
  return reduce(sortFormats, (memo, str) => (memo ? `${memo}/${str}` : str),  '');
};

const sessionToStr = (sessions: ICinemaSession[]): string => {
  let str: string = '';
  const sortItems = sortBy(sessions, ({time}) => time);
  for (const session of sortItems) {
    str = str ? `${str}, \`${session.time}\`` : `\`${session.time}\``;
  }
  return `🕒 ${str}`;
};
