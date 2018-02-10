// Require
const _ = require('lodash');
const cache = require('./cache');
const admin = require('./admin');
const chats = require('./chats');
const TelegramBot = require('node-telegram-bot-api');
const {
  statsMsgForPeriod,
  logEvent,
} = require('./stats');
const {
  getCinemasData,
  cinemsDataToMsg,
} = require('./cinemas');
// Consts
const REPLY_WAIT_TIMEOUT = 1000;
const SCHEDULE_CACHE_KEY = 'schedule';
const SCHEDULE_CACHE_EXP = 60 * 60;
// Events
const GET_EVENT = 'get';
const HELP_EVENT = 'help';
const START_EVENT = 'start';
const SUBSCRIBE_EVENT = 'subscribe';
const UNSUBSCRIBE_EVENT = 'unsubscribe';
// Groups
const UNSUBSCRIBE_GROUP ='unsubscribe';
// Messages
const {
  RN,
  DRN,
  commandsText,
  helpMsg,
  startMsg,
  sorryMsg,
  serviceErrMsg,
  cmdParamErr,
  waitMsg,
  loginedMsg,
  logoutMsg,
  logoutErrMsg,
  subscribeMsg,
  unsubscribeMsg,
} = require('./msg');
// Log
const log = require('./log').withModule('bot');

// Helpers

const strFromCmd = (text) => {
  const regex = /\/[\w\d_-]+ ([\w\d_-]+)/g;
  const match = regex.exec(text);
  return match ? match[1] : null;
}

// CinemaBot
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
    if(modText.indexOf('/start') === 0){
      this.onStartCmd(chatId, modText);
      logEvent(START_EVENT);
    }else if(modText.indexOf('/help') === 0){
      this.onHelpCmd(chatId);
      logEvent(HELP_EVENT);
    }else if(modText.indexOf('/schedule') === 0){
      this.onScheduleCmd(chatId);
      logEvent(GET_EVENT);
    }else if(modText.indexOf('/subscribe') === 0){
      this.onSubscribeCmd(chatId);
      logEvent(SUBSCRIBE_EVENT);
    }else if(modText.indexOf('/unsubscribe') === 0){
      this.onUnsubscribeCmd(chatId);
      logEvent(UNSUBSCRIBE_EVENT);
    }else if(modText.indexOf('/notify') === 0){
      this.onNotifyCmd(chatId, modText);
    }else if(modText.indexOf('/stats') === 0){
      this.onStatsCmd(chatId, modText);
    }else if(modText.indexOf('/logout') === 0){
      this.onLogoutCmd(chatId);
    }else{
      this.sendMsg(chatId, sorryMsg);
    }
    chats.add(chatId);
  }

  onStartCmd(chatId, text){
    if(text === '/start'){
      this.sendMsg(chatId, startMsg);
    }else{
      const regex = /\/start ([\w\d_-]+)/g;
      const match = regex.exec(text);
      if(!match) return this.sendMsg(chatId, startMsg);
      const accessToken = match[1];
      admin.login(chatId, accessToken).then((isLogined) => {
        if(!isLogined) return this.sendMsg(chatId, startMsg);
        else return this.sendMsg(chatId, loginedMsg);
      }).catch((err) => {
        log.err(err);
        this.sendMsg(chatId, serviceErrMsg);
      });
    }
  }

  async onStatsCmd(chatId, text){
   try{
    const isAdmin = await admin.isLogined(chatId);
    if(!isAdmin) return this.sendMsg(chatId, sorryMsg);
    const period = strFromCmd(text) || 'week';
    if(['day', 'week', 'month', 'year'].indexOf(period) === -1){
      return this.sendMsg(chatId, cmdParamErr);
    }
    const msg = await statsMsgForPeriod(period);
    this.sendMsg(chatId, msg, { parse_mode: 'markdown' });
   }catch(e){
     log.err(e);
     this.sendMsg(chatId, serviceErrMsg)
   }
  }

  async onLogoutCmd(chatId){
    try{
      const isAdmin = await admin.isLogined(chatId);
      if(!isAdmin) return this.sendMsg(chatId, sorryMsg);
      const isLogouted = await admin.logout(chatId);
      if(!isLogouted) return this.sendMsg(chatId, logoutErrMsg);
      this.sendMsg(chatId, logoutMsg);
     }catch(e){
       log.err(e);
       this.sendMsg(chatId, serviceErrMsg)
     }
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
      const cinemasData = await this.getCachedCinemasData();
      // Reset timeout
      clearTimeout(waitHandler);
      // Reply
      const cinemasMsg = cinemsDataToMsg(cinemasData);
      this.sendMsg(chatId, cinemasMsg, {parse_mode: 'markdown', disable_web_page_preview: true});
    }catch(err){
      // Reset timeout
      clearTimeout(waitHandler);
      // Log problems
      log.err(err);
      this.sendMsg(chatId, serviceErrMsg);
    }
  }

  // Subscriptions

  onSubscribeCmd(chatId){
    chats.removeFromGroup(chatId, UNSUBSCRIBE_GROUP);
    this.sendMsg(chatId, subscribeMsg);
  }

  onUnsubscribeCmd(chatId){
    chats.addToGroup(chatId, UNSUBSCRIBE_GROUP);
    this.sendMsg(chatId, unsubscribeMsg);
  }

  async onNotifyCmd(chatId, text){
    try{
      const isAdmin = await admin.isLogined(chatId);
      if(!isAdmin) return this.sendMsg(chatId, sorryMsg);
      const msg = text.replace('/notify', '').trim();
      await this.notifySubscrUsersWithMsg(msg);
     }catch(e){
       log.err(e);
       this.sendMsg(chatId, serviceErrMsg)
     }
  }

  async notifySubscrUsersWithMsg(msg){
    const subscrChats = await chats.getNotInGroup(UNSUBSCRIBE_GROUP);
    log(`sending notification with text: "${msg}", users: ${subscrChats.length}`);
    for(const subscrChatId of subscrChats){
      this.sendMsg(subscrChatId, msg);
    }
  }

  // Bot

  sendMsg(chatId, msg, opt){
    this.bot.sendMessage(chatId, msg, opt);
  }

  sendTypingAction(chatId){
    this.bot.sendChatAction(chatId, 'typing');
  }

  // Data

  async getCachedCinemasData(){
    if(!this.cacheEnabled){
      log.debug(`cache disabled, loading cinemas data from api`);
      return await getCinemasData();
    }
    const cachedData = await cache.getCache(SCHEDULE_CACHE_KEY);
    if(cachedData){
      log.debug(`loading cinemas data from cache`);
      return cachedData;
    }
    log.debug(`loading cinemas data from api`);
    const data = await getCinemasData();
    log.debug(`saving data to cache`);
    cache.setCache(SCHEDULE_CACHE_KEY, data, SCHEDULE_CACHE_EXP);
    return data;
  }

}

module.exports = CinemaBot;
