/*
/setcommands
schedule - Розклад сеансів
help - Допомога
*/
// Don't show error when loading telegram api library
process.env["NTBA_FIX_319"] = 1;
// Require
const _ = require('lodash');
const moment = require('moment');
const TelegramBot = require('node-telegram-bot-api');
const {galaktika} = require('./common/services');
const log = require('./common/log.js').withModule('index');
// Bot
const token = process.env.TELEGRAM_TOKEN;
if(!token){
  console.error('telegram token not specified');
  process.exit(1);
}
log.info('bot started');
const bot = new TelegramBot(token, {polling: true});
// Consts
const REPLY_WAIT_TIMEOUT = 1000;
const RN = '\r\n';
const DRN = `${RN}${RN}`;
// Templates
const commandsText = `
/schedule - розклад сеансів
/help - допомога
`;
const helpMsg = `
Я вмію виконувати наступні команди:
${commandsText}
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

bot.on('message', (msg) => {
  const chatId = _.get(msg, ['chat', 'id']);
  const {text} = msg;
  let modText = text.trim();
  log.debug(`[${chatId}] ${text}`);
  if(modText === '/start'){
    bot.sendMessage(chatId, startMsg);
  }else if(modText === '/help'){
    bot.sendMessage(chatId, helpMsg);
  }else if(modText === '/schedule'){
    bot.sendMessage(chatId, waitMsg);
    const waitHandler = setTimeout(() => (
      bot.sendMessage(chatId, waitMsg)
    ), REPLY_WAIT_TIMEOUT);
    galaktika.getSchedule()
      .then((scheduleData) => {
        clearTimeout(waitHandler);
        const scheduleStr = cinemaScheduleToMsg(scheduleData);
        let reply = '';
        reply += `[Кінотеатр "Галактика"](http://galaktika-kino.com.ua/)${DRN}`;
        reply += `${scheduleStr}${DRN}`;
        reply += `Бронювання квитків за телефоном:${RN}`;
        reply += `(067) 534-4-534`;
        bot.sendMessage(chatId, reply, {parse_mode: 'markdown', disable_web_page_preview: true});
      })
      .catch((err)=> {
        clearTimeout(waitHandler);
        log.err(err);
        bot.sendMessage(chatId, serviceUnavaliableMsgh);
      });
  }else{
    bot.sendMessage(chatId, sorryMsg);
  }
});


const cinemaScheduleToMsg = (periods) => {
  let msg = '';
  _.each(periods, (period) => {
    msg = !msg ? periodToMsg(period) : `${DRN}${periodToMsg(period)}`;
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
  const startTs = moment(start, "D.M.YYYY").toDate().getTime();
  const endTs = moment(end, "D.M.YYYY").toDate().getTime();
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
