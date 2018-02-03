// Don't show error when loading telegram api library
process.env["NTBA_FIX_319"] = 1;
// Require
const Bot = require('./lib/bot');
// Log
const log = require('./common/log.js').withModule('app');

const env = process.env;
if(!env.KREMEN_CINEMA_BOT_TOKEN){
  console.error('telegram token not specified');
  process.exit(1);
}
const token = env.KREMEN_CINEMA_BOT_TOKEN;
const cacheEnabled = (env.CACHE_ENABLED === "false") || (env.CACHE_ENABLED === "0") ? false : true;
const bot = new Bot({token, cacheEnabled});
log.debug(cacheEnabled ? 'cache enabled' : 'cache disabled');
log.info('bot started');