'use strict';

const Bot = require('./lib/bot');
const log = require('./lib/log');

const { env } = process;
const TOKEN = env.BOT_TOKEN;
if(!TOKEN){
  log.err('Bot token not specified');
  process.exit(1);
}

const bot = new Bot(TOKEN);

const processReq = async (event, context) => {
  const { httpMethod, body } = event;
  if(httpMethod === 'POST' && body){
    const data = JSON.parse(body);
    await bot.processUpdate(data);
  }else if(httpMethod === 'GET'){
    log('GET request, ignoring');
  }
  return okResp();
}

const okResp = (body) => ({
  statusCode: '200',
  headers: {},
  body: body ? JSON.stringify(body) : '',
  isBase64Encoded: false,
});

exports.handler = (event, context, cb) => {
  log(event);
  processReq(event, context).then((res) => {
    cb(null, res);
  }).catch((err) => {
    cb(err);
  });
};
