'use strict';
// Don't show error when loading telegram api library
process.env["NTBA_FIX_319"] = 1;

const TelegramBot = require('node-telegram-bot-api');

const log = (...args) => console.log(...args);
const logErr = (...args) => console.error(...args);

const okResp = (body) => ({
  statusCode: '200',
  headers: {},
  body: body ? JSON.stringify(body) : '',
  isBase64Encoded: false,
});

const delay = (ms) => new Promise(
  resolve => setTimeout(() => resolve(), ms)
);

const { env } = process;
const TOKEN = env.BOT_TOKEN;
if(!TOKEN){
  logErr('bot token not specified');
  process.exit(1);
}

const bot = new TelegramBot(TOKEN);

bot.on('message', async (msg) => {
  log('on message event: ', msg);
  log('sending reply');
  await bot.sendMessage(msg.chat.id, 'I am alive!');
  log('sending reply done');
});

exports.handler = async (event, context) => {
  log(event);
  const { httpMethod, body } = event;
  if(httpMethod === 'POST' && body){
    const data = JSON.parse(body);
    log('bot webhook request: ', data);
    bot.processUpdate(data);
    await delay(1000);
    return okResp();
  }else if(httpMethod === 'GET'){
    log('GET request');
    return okResp();
  }
  return okResp();
};
