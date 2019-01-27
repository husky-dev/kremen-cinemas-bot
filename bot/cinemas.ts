import aws, { Lambda } from 'aws-sdk';
import { ICinema, ICinemaHall, ISchedulePeriod } from 'common/types';
import { each, isString, uniq } from 'lodash';
import moment from 'moment';
import { DRN, Log, RN  } from 'utils';
const log = Log('cinemas');
const {env: {NODE_ENV}} = process;

const cinemaDataProviders = [
  `kremen-cinema-${NODE_ENV}-cinemas`,
];

const lambda = new aws.Lambda({ region: 'us-east-1' });

const invokeLambda = async (params: Lambda.Types.InvocationRequest) => (
  new Promise<Lambda.Types.InvocationResponse>((resolve, reject) => (
    lambda.invoke(params, (err, data) => err ? reject(err) : resolve(data))
  ))
);

const getDataFromLambda =  async (params: Lambda.Types.InvocationRequest) => {
  const { StatusCode, Payload } = await invokeLambda(params);
  if (StatusCode !== 200) { throw new Error(`Wrong lambda response status code: ${StatusCode}`); }
  if (!isString(Payload)) { throw new Error(`Wrong lambda response payload format`); }
  try {
    return JSON.parse(Payload);
  } catch (err) {
    throw new Error('Parsing lamda payload err');
  }
};

const getDataBodyFromLambda = async (params: Lambda.Types.InvocationRequest) => {
  const resp = await getDataFromLambda(params);
  if (!resp) { throw new Error('Lambda response is empty'); }
  if (!resp.body) { throw new Error('Lambda response resp.body is empty'); }
  if (!isString(resp.body)) { throw new Error('Lambda response resp.body is not a string'); }
  try {
    return JSON.parse(resp.body);
  } catch (err) {
    throw new Error('Parsing lamda resp.body err');
  }
};

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
  const movies: string[] = [];
  cinemas.forEach((cinema) => {
    const { schedule } = cinema;
    if (!schedule) { return; }
    schedule.forEach((period) => {
      const { halls } = period;
      if (!halls) { return; }
      halls.forEach((hall) => {
        const { sessions } = hall;
        sessions.forEach((session) => {
          if (session.title) {
            movies.push(session.title);
          }
        });
      });
    });
  });
  return uniq(movies);
};

// Text

export const cinemsDataToMsg = (items: ICinema[]) => {
  let msg = '';
  items.forEach((item, index) => {
    const cinemaMsg = cinemaDataToMsg(item);
    msg += index > 0 ? `${DRN}${cinemaMsg}` : cinemaMsg;
  });
  return msg;
};

const cinemaDataToMsg = ({title, website, contacts, schedule}: ICinema) => {
  const scheduleStr = cinemaScheduleToMsg(schedule);
  let reply = '';
  if (title && website) {
    reply += `🎥 [${title}](${website})${DRN}`;
  } else if (title) {
    reply += `🎥 ${title}${DRN}`;
  }
  reply += `${scheduleStr}${DRN}`;
  if (contacts && contacts.length) {
    reply += `Бронювання квитків:${RN}`;
    contacts.forEach((contact) => {
      if (contact.mobile) {
        reply += `${RN}📱${contact.mobile}`;
      }
    });
  }
  return reply;
};

const cinemaScheduleToMsg = (periods: ISchedulePeriod[]): string => {
  let msg = '';
  each(periods, (period) => {
    msg = !msg ? periodToMsg(period) : `${msg}${DRN}${DRN}${periodToMsg(period)}`;
  });
  return msg;
};

const periodToMsg = (period: ISchedulePeriod): string => {
  let msg = '';
  if (period.start && period.end) {
    if (isPeriodNow(period.start, period.end)) {
      msg += `🔥 *Зараз у кіно*`;
    } else {
      msg += `📅 *${period.start}* - *${period.end}*`;
    }
    msg += DRN;
    msg += hallsToMsg(period.halls);
  }
  return msg;
};

const hallsToMsg = (halls: ICinemaHall[]): string => {
  let msg = '';
  each(halls, (hall) => {
    msg += !msg ? hallToMsg(hall) : `${DRN}${hallToMsg(hall)}`;
  });
  return msg;
};

const hallToMsg = (hall: ICinemaHall): string => {
  let msg = '';
  if (hall.name) {
    msg += `🍿 *${hall.name}*`;
    if (hall.places) {
      msg += ` *(${hall.places} ${placesDependsOnCount(hall.places)})*`;
    }
    msg += `${RN}`;
  }
  each(hall.sessions, ({title, format, time, price}) => {
    msg += `${RN}🕒 \`${time}:\``;
    if (format) {
      msg += ` (${format})`;
    }
    if (price) {
      msg += `(${price})`;
    }
    msg += ` ${title}`;
  });
  return msg;
};

const isPeriodNow = (start: string, end: string): boolean => {
  const startTs = moment(start, 'DD.M.YYYY').toDate().getTime();
  const endTs = moment(end, 'DD.M.YYYY').toDate().getTime() + 1000 * 60 * 60 * 24;
  const nowTs = (new Date()).getTime();
  return (nowTs >= startTs) && (nowTs <= endTs);
};

const placesDependsOnCount = (count: number): string => {
  if (!count) { return 'місць'; }
  if (count === 1) { return 'місце'; }
  if ((count >= 2) && (count <= 4)) { return 'місця'; }
  if ((count >= 5) && (count <= 19)) { return 'місць'; }
  const modCount = count < 100 ? count % 10 : count % 100;
  return placesDependsOnCount(modCount);
};
