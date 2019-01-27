import { ICinema, ICinemaHall, ISchedulePeriod } from 'common/types';
import { each, uniq } from 'lodash';
import moment from 'moment';
import { asyncReq, DRN, Log, RN  } from 'utils';
// const { env: { NODE_ENV } } = process;
const log = Log('cinemas');

const cinemaUrls = [
  `https://68j5kacxr1.execute-api.us-east-1.amazonaws.com/prod/cinemas/galaxy`,
];

const getCinemaDataByUrl = async (url: string): Promise<ICinema> => {
  const { body } = await asyncReq({ url, json: true });
  return body;
};

export const getCinemasData = async () => {
  const cinemas: ICinema[] = [];
  for (const url of cinemaUrls) {
    try {
      const data = await getCinemaDataByUrl(url);
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
