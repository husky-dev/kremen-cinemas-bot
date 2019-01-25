import { each, isDate } from 'lodash';
import moment from 'moment';
import { DRN, hourMs, pad, RN } from 'utils';
import { projectKey, redisClient } from './redis';

const rootKey = `${projectKey}:stats`;
const eventsKey = `${rootKey}:events`;

const GET_EVENT = 'get';
const HELP_EVENT = 'help';
const START_EVENT = 'start';
const SUBSCRIBE_EVENT = 'subscribe';
const UNSUBSCRIBE_EVENT = 'unsubscribe';

const periodToResolution = (period) => {
  if (period === 'year') { return 'month'; }
  if (period === 'month') { return 'week'; }
  if (period === 'week') { return 'day'; }
  if (period === 'day') { return 'hour'; }
  return 'hour';
};

const statsDataToMsg = (start, end, data) => {
  const startStr = moment(start).format('YYYY-MM-DD');
  const endStr = moment(end).format('YYYY-MM-DD');
  let msg = `*${startStr}* - *${endStr}*${DRN}`;
  let total = 0;
  each(data, (val, key) => {
    total += val;
    msg += `\`${key}\`: ${val}${RN}`;
  });
  msg += `${RN}\`Total\`: ${total}`;
  return msg;
};

const statsMsgForPeriod = async (period) => {
  const end = new Date();
  const start = moment(end).subtract(1, period).toDate();
  const resolution = periodToResolution(period);
  const data = await getEventStatsForPeriod(GET_EVENT, start, end, resolution);
  return statsDataToMsg(start, end, data);
};

// Cunctionality

const eventKeyWithDate = (eventName, date) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  return `${eventsKey}:${eventName}:${year}:${month}:${day}:${hours}`;
};

const dateToTimeStr = (d) => {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1, 2)}-${pad(d.getDate(), 2)} ${pad(d.getHours(), 2)}:00`;
};

const dateToDateStr = (d) => {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1, 2)}-${pad(d.getDate(), 2)}`;
};

const dateToMonthStr = (d) => {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1, 2)}`;
};

const logEvent = (eventName) => new Promise((resolve, reject) => {
  const now = new Date();
  const key = eventKeyWithDate(eventName, now);
  redisClient.incr(key, (err, reply) => (
    err ? reject(err) : resolve(reply)
  ));
});

const resolutionToDateDataKey = (date, resolution = 'hour') => {
  switch (resolution) {
    case 'hour':
      return dateToTimeStr(date);
    case 'day':
      return dateToDateStr(date);
    case 'month':
      return dateToMonthStr(date);
    default:
      return dateToDateStr(date);
  }
};

const getEventStatsForPeriod = async (eventName, start, end, resolution = 'hour') => {
  const startTs = isDate(start) ? start.getTime() : (new Date(start)).getTime();
  const endTs = isDate(end) ? end.getTime() : (new Date(end)).getTime();
  let curTs = startTs;
  const data = {};
  while (curTs < endTs) {
    const cur = new Date(curTs);
    const statKey = eventKeyWithDate(eventName, cur);
    const val = await getIntVal(statKey);
    const dataKey = resolutionToDateDataKey(cur, resolution);
    data[dataKey] = !data[dataKey] ? val : data[dataKey] + val;
    curTs += hourMs;
  }
  return data;
};

const getIntVal = (key) => new Promise((resolve, reject) => {
  redisClient.get(key, (err, val) => {
    if (err) { return reject(err); }
    if (!val) { return resolve(0); } else { return resolve(parseInt(val, 10)); }
  });
});

export default {
  GET_EVENT,
  getEventStatsForPeriod,
  HELP_EVENT,
  logEvent,
  START_EVENT,
  statsMsgForPeriod,
  SUBSCRIBE_EVENT,
  UNSUBSCRIBE_EVENT,
};
