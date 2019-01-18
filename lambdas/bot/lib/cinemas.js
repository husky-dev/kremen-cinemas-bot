'use strict';

const _ = require('lodash');
const moment = require('moment');
const { asyncReq } = require('./async');
const { RN, DRN } = require('./msg');

const cinemaUrls = [
  'https://api.io.kr.ua/cinema/galaktika',
];

const getCinemaDataByUrl = async (url) => {
  const { body } = await asyncReq({ url, json: true });
  return body;
}

const getCinemasData = async () => {
  const schedules = [];
  for(const url of cinemaUrls){
    try{
      const data = await getCinemaDataByUrl(url);
      schedules.push(data);
    }catch(err){
      console.error(err);
    }
  }
  return schedules;
}

const moviesListFromCinemasData = (cinemas) => {
  const movies = [];
  cinemas.forEach((cinema) => {
    const { schedule } = cinema;
    if(!schedule) return;
    schedule.forEach((period) => {
      const { halls } = period;
      if(!halls) return;
      halls.forEach((hall) => {
        const { sessions } = hall;
        sessions.forEach((session) => {
          if(session.title){
            movies.push(session.title);
          }
        });
      });
    });
  });
  return _.uniq(movies);
}

// Text

const cinemsDataToMsg = (items) => {
  let msg = '';
  items.forEach((item, index) => {
    const cinemaMsg = cinemaDataToMsg(item);
    msg += index > 0 ? `${DRN}${cinemaMsg}` : cinemaMsg;
  });
  return msg;
}

const cinemaDataToMsg = ({title, website, contacts, schedule}) => {
  const scheduleStr = cinemaScheduleToMsg(schedule);
  let reply = '';
  if(title && website){
    reply += `🎥 [${title}](${website})${DRN}`;
  }else if(title){
    reply += `🎥 ${title}${DRN}`;
  }
  reply += `${scheduleStr}${DRN}`;
  if(contacts && contacts.length){
    reply += `Бронювання квитків:${RN}`;
    contacts.forEach((contact) => {
      if(contact.mobile){
        reply += `${RN}📱${contact.mobile}`;
      }
    });
  }
  return reply;
}

const cinemaScheduleToMsg = (periods) => {
  let msg = '';
  _.each(periods, (period) => {
    msg = !msg ? periodToMsg(period) : `${msg}${DRN}${DRN}${periodToMsg(period)}`;
  });
  return msg;
}

const periodToMsg = (period) => {
  let msg = '';
  if(period.start && period.end){
    if(isPeriodNow(period.start, period.end)){
      msg += `🔥 *Зараз у кіно*`;
    }else{
      msg += `📅 *${period.start}* - *${period.end}*`;
    }
    msg += DRN;
    msg += hallsToMsg(period.halls);
  }
  return msg;
}

const hallsToMsg = (halls) => {
  let msg = '';
  _.each(halls, hall => {
    msg += !msg ? hallToMsg(hall) : `${DRN}${hallToMsg(hall)}`;
  })
  return msg;
}

const hallToMsg = (hall) => {
  let msg = '';
  if(hall.name){
    msg += `🍿 *${hall.name}*`;
    if(hall.places){
      msg += ` *(${hall.places} ${placesDependsOnCount(hall.places)})*`
    }
    msg += `${RN}`;
  }
  _.each(hall.sessions, ({title, format, time, price}) => {
    msg += `${RN}🕒 \`${time}:\``;
    if(format){
      msg += ` (${format})`;
    }
    if(price){
      msg += `(${price})`;
    }
    msg += ` ${title}`;
  });
  return msg;
}

const isPeriodNow = (start, end) => {
  const startTs = moment(start, 'DD.M.YYYY').toDate().getTime();
  const endTs = moment(end, 'DD.M.YYYY').toDate().getTime() + 1000 * 60 * 60 * 24;
  const nowTs = (new Date()).getTime();
  return (nowTs >= startTs) && (nowTs <= endTs);
}

const placesDependsOnCount = (count) => {
  if(!count) return 'місць';
  if(count === 1) return 'місце';
  if((count >= 2)&&(count <= 4)) return 'місця';
  if((count >= 5)&&(count <= 19)) return 'місць';
  const modCount = count < 100 ? count % 10 : count % 100;
  return placesDependsOnCount(modCount);
}

module.exports = {
  getCinemasData,
  cinemsDataToMsg,
  moviesListFromCinemasData,
}
