// Require
const _ = require('lodash');
const { galaktika } = require('../common/services');
const cache = require('./cache');
const stats = require('./stats');
const moment = require('moment');
const TelegramBot = require('node-telegram-bot-api');
// Consts
const REPLY_WAIT_TIMEOUT = 1000;
const SCHEDULE_CACHE_KEY = 'schedule';
const SCHEDULE_CACHE_EXP = 60 * 60;
const SCHEDULE_GET_EVENT = 'get';
const SCHEDULE_HELP_EVENT = 'help';
const SCHEDULE_START_EVENT = 'start';
const RN = '\r\n';
const DRN = `${RN}${RN}`;
// Log
const log = require('../common/log.js').withModule('bot');

// Commands
/*
schedule - Розклад сеансів
help - Допомога
*/

// Messages

const commandsText = `
/schedule - розклад сеансів
/help - допомога
`;

const helpMsg = `
Я вмію виконувати наступні команди:
${commandsText}
Контакти:
https://fb.me/snipter
`;

const startMsg = `
Привіт! Я вмію збирати інформацію про сеанси фільмів в Кременчуці і відправляти їх тобі в зручному форматі. Я можу виконувати наступні команди:
${commandsText}
`;

const sorryMsg = `
Вибач, але я не зрозумів тебе... Я можу виконувати наступні команди:
${commandsText}
`;

const serviceUnavaliableMsgh = `
Вибач, але сервіс тимчасово недоступний...
`;

const waitMsg = `
Хвилинку...
`;

class CinemaBot{
  constructor({token, cacheEnabled = true}){
    if(!token) throw new Error('bot token required');
    this.cacheEnabled = cacheEnabled;
    this.bot = new TelegramBot(token, {polling: true});
    this.bot.on('message', this.onMessage.bind(this));
  }

  onMessage(msg){
    /*
    { message_id: 1,
      from:
      { id: 1801040,
        is_bot: false,
        first_name: 'Jaroslav',
        last_name: 'Khorishchenko',
        username: 'ideveloper' },
      chat:
      { id: 1801040,
        first_name: 'Jaroslav',
        last_name: 'Khorishchenko',
        username: 'ideveloper',
        type: 'private' },
      date: 1514728849,
      text: '/start',
      entities: [ { offset: 0, length: 6, type: 'bot_command' } ] }
    */
    const chatId = _.get(msg, ['chat', 'id']);
    const {text} = msg;
    let modText = text.trim();
    log.debug(`[${chatId}] ${text}`);
    if(modText === '/start'){
      this.onStartCmd(chatId);
      stats.logEvent(SCHEDULE_START_EVENT);
    }else if(modText === '/help'){
      this.onHelpCmd(chatId);
      stats.logEvent(SCHEDULE_HELP_EVENT);
    }else if(modText === '/schedule'){
      this.onScheduleCmd(chatId);
      stats.logEvent(SCHEDULE_GET_EVENT);
    }else{
      this.sendMsg(chatId, sorryMsg);
    }
  }

  onStartCmd(chatId){
    this.sendMsg(chatId, startMsg);
  }

  onHelpCmd(chatId){
    this.sendMsg(chatId, helpMsg, {disable_web_page_preview: true});
  }

  async onScheduleCmd(chatId){
    // Set timeout if operation will take for a wile
    const waitHandler = setTimeout(() => {
      this.sendMsg(chatId, waitMsg);
    }, REPLY_WAIT_TIMEOUT);
    // Try to get schedule
    try{
      const cachedScheduleData = this.cacheEnabled ? await cache.getCache(SCHEDULE_CACHE_KEY) : null;
      if(cachedScheduleData){
        log.debug(`schedule loaded from cache`);
        // Reset timeout
        clearTimeout(waitHandler);
        const reply = galaktikaScheduleToMsg(cachedScheduleData);
        this.sendMsg(chatId, reply, {parse_mode: 'markdown', disable_web_page_preview: true});
      }else{
        log.debug(`schedule loaded from website`);
        const scheduleData = await galaktika.getSchedule();
        // Reset timeout
        clearTimeout(waitHandler);
        // Respond
        const reply = galaktikaScheduleToMsg(scheduleData);
        this.sendMsg(chatId, reply, {parse_mode: 'markdown', disable_web_page_preview: true});
        if(this.cacheEnabled){
          log.debug(`[${chatId}] saving schedule to cache`);
          cache.setCache(SCHEDULE_CACHE_KEY, scheduleData, SCHEDULE_CACHE_EXP);
        }
      }
    }catch(err){
      // Reset timeout
      clearTimeout(waitHandler);
      // Log problems
      log.err(err);
      this.sendMsg(chatId, serviceUnavaliableMsgh);
    }
  }

  sendMsg(chatId, msg, opt){
    this.bot.sendMessage(chatId, msg, opt);
  }

  sendTypingAction(chatId){
    this.bot.sendChatAction(chatId, 'typing');
  }

}

const galaktikaScheduleToMsg = (scheduleData) => {
  const scheduleStr = cinemaScheduleToMsg(scheduleData);
  let reply = '';
  reply += `[Кінотеатр "Галактика"](http://galaktika-kino.com.ua/)${DRN}`;
  reply += `${scheduleStr}${DRN}`;
  reply += `Бронювання квитків за телефоном:${RN}`;
  reply += `(067) 534-4-534`;
  return reply;
}

const cinemaScheduleToMsg = (periods) => {
  let msg = '';
  _.each(periods, (period) => {
    msg = !msg ? periodToMsg(period) : `${msg}${DRN}${RN}${periodToMsg(period)}`;
  });
  return msg;
}

const periodToMsg = (period) => {
  let msg = '';
  if(period.start && period.end){
    if(isPeriodNow(period.start, period.end)){
      msg += `*Зараз у кіно*`;
    }else{
      msg += `*${period.start}* - *${period.end}*`;
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
    msg += `*${hall.name}*`;
    if(hall.places){
      msg += ` *(${hall.places} ${placesDependsOnCount(hall.places)})*`
    }
    msg += `${RN}`;
  }
  _.each(hall.sessions, ({title, format, time, price}) => {
    msg += `${RN}\`${time}:\``;
    if(format){
      msg += ` (${format})`;
    }
    msg += ` ${title}`;
    if(price){
      msg += ` - ${price} грн.`;
    }
  });
  return msg;
}

const isPeriodNow = (start, end) => {
  const startTs = moment(start, "DD.M.YYYY").toDate().getTime();
  const endTs = moment(end, "DD.M.YYYY").toDate().getTime() + 1000 * 60 * 60 * 24;
  const nowTs = (new Date()).getTime();
  return (nowTs >= startTs) && (nowTs <= endTs);
}

const placesDependsOnCount = (count) => {
  if(!count) return 'місць';
  if(count === 1) return 'місце';
  if((count >= 2)&&(count <= 4)) return 'місця';
  if((count >= 5)&&(count <= 19)) return 'місць';
  let modCount = count;
  if(modCount < 100){
    modCount = modCount % 10;
  }else{
    modCount = modCount % 10;
  }
  if(modCount === 1) return 'місце';
  if((modCount >= 2)&&(modCount <= 4)) return 'місця';
  if((modCount >= 5)&&(modCount <= 9)) return 'місць';
  return 'місць';
}

module.exports = CinemaBot;
