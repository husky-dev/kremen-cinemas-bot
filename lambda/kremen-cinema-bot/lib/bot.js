'use strict';

const TelegramBot = require('./tgbot');
const _ = require('lodash');
const cache = require('./cache');
const admin = require('./admin');
const chats = require('./chatsStore');
const moviesStore = require('./moviesStore');
const { 
  statsMsgForPeriod, logEvent, GET_EVENT, HELP_EVENT, START_EVENT, SUBSCRIBE_EVENT, UNSUBSCRIBE_EVENT,
} = require('./stats');
const {
  getCinemasData, cinemsDataToMsg, moviesListFromCinemasData,
} = require('./cinemas');
const { secondMs, hourMs } = require('./utils');
const REPLY_WAIT_TIMEOUT = secondMs;
const CHECK_NEW_MOVIES_INTERVAL = hourMs;
const SCHEDULE_CACHE_KEY = 'schedule';
const SCHEDULE_CACHE_EXP = 60 * 60;
const UNSUBSCRIBE_GROUP ='unsubscribe';
const {
  RN, DRN, commandsText, helpMsg, startMsg, sorryMsg, serviceErrMsg, cmdParamErr,
  waitMsg, loginedMsg, logoutMsg, logoutErrMsg, subscribeMsg, unsubscribeMsg,
} = require('./msg');
const log = require('./log');

const clearMsg = (rawMsg) => {
  if(!rawMsg) return '';
  let msg = rawMsg.trim();
  return msg;
}

class CinemaBot{
  constructor(token, cacheEnabled = true){
    this.cacheEnabled = cacheEnabled;
    this.tgbot = new TelegramBot(token);
  }

  async processUpdate(data){
    log('processing update: ', data);
    // const editedMessage = update.edited_message;
    // const channelPost = update.channel_post;
    // const editedChannelPost = update.edited_channel_post;
    // const inlineQuery = update.inline_query;
    // const chosenInlineResult = update.chosen_inline_result;
    // const callbackQuery = update.callback_query;
    // const shippingQuery = update.shipping_query;
    // const preCheckoutQuery = update.pre_checkout_query;
    if(data.message){
      await this.processTextMsg(data.message);
    }
  }

  /* {
    "update_id": 287236163,
    "message": {
      "message_id": 479,
      "from": {
        "id": 1801040,
        "is_bot": false,
        "first_name": "Jaroslav",
        "last_name": "Khorishchenko",
        "username": "ideveloper",
        "language_code": "en-UA"
      },
      "chat": {
        "id": 1801040,
        "first_name": "Jaroslav",
        "last_name": "Khorishchenko",
        "username": "ideveloper",
        "type": "private"
      },
      "date": 1528208016,
      "text": "hi"
    }
  } */
  async processTextMsg(message){
    log('message received: ', message);
    const chatId = message.chat.id;
    const text = clearMsg(message.text);

    log.debug(`(${chatId}) ${text}`);
    chats.add(chatId);
    try{
      if(text.indexOf('/start') === 0){
        await this.onStartCmd(chatId, text);
        logEvent(START_EVENT);
      }else if(text.indexOf('/help') === 0){
        await this.onHelpCmd(chatId);
        logEvent(HELP_EVENT);
      }else if(text.indexOf('/schedule') === 0){
        await this.onScheduleCmd(chatId);
        logEvent(GET_EVENT);
      }else if(text.indexOf('/subscribe') === 0){
        await this.onSubscribeCmd(chatId);
        logEvent(SUBSCRIBE_EVENT);
      }else if(text.indexOf('/unsubscribe') === 0){
        await this.onUnsubscribeCmd(chatId);
        logEvent(UNSUBSCRIBE_EVENT);
      }else if(text.indexOf('/notify') === 0){
        await this.onNotifyCmd(chatId, text);
      }else if(text.indexOf('/stats') === 0){
        await this.onStatsCmd(chatId, text);
      }else if(text.indexOf('/logout') === 0){
        await this.onLogoutCmd(chatId);
      }else{
        await this.sendMsg(chatId, sorryMsg);
      }
    }catch(err){
      log.err(err);
      await this.sendMsg(chatId, serviceErrMsg);
    }
  }

  async onStartCmd(chatId, text){
    if(text === '/start'){
      await this.sendMsg(chatId, startMsg);
    }else{
      const regex = /\/start ([\w\d_-]+)/g;
      const match = regex.exec(text);
      if(!match) return await this.sendMsg(chatId, startMsg);
      const accessToken = match[1];
      const isLogined = await admin.login(chatId, accessToken);
      if(!isLogined){
        await this.sendMsg(chatId, startMsg);
      } else {
        await this.sendMsg(chatId, loginedMsg);
      }
    }
  }

  async onStatsCmd(chatId, text){
   try{
    const isAdmin = await admin.isLogined(chatId);
    if(!isAdmin) return await this.sendMsg(chatId, sorryMsg);
    const period = strFromCmd(text) || 'week';
    if(['day', 'week', 'month', 'year'].indexOf(period) === -1){
      return await this.sendMsg(chatId, cmdParamErr);
    }
    const msg = await statsMsgForPeriod(period);
    await this.sendMsg(chatId, msg, { parse_mode: 'markdown' });
   }catch(e){
     log.err(e);
     await this.sendMsg(chatId, serviceErrMsg)
   }
  }

  async onLogoutCmd(chatId){
    try{
      const isAdmin = await admin.isLogined(chatId);
      if(!isAdmin) return await this.sendMsg(chatId, sorryMsg);
      const isLogouted = await admin.logout(chatId);
      if(!isLogouted) return await this.sendMsg(chatId, logoutErrMsg);
      await this.sendMsg(chatId, logoutMsg);
     }catch(e){
       log.err(e);
       await this.sendMsg(chatId, serviceErrMsg)
     }
  }

  async onHelpCmd(chatId){
    await this.sendMsg(chatId, helpMsg, {disable_web_page_preview: true});
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
      await this.sendMsg(chatId, cinemasMsg, { parse_mode: 'markdown', disable_web_page_preview: true });
    }catch(err){
      // Reset timeout
      clearTimeout(waitHandler);
      // Log problems
      log.err(err);
      await this.sendMsg(chatId, serviceErrMsg);
    }
  }

  // Subscriptions

  async onSubscribeCmd(chatId){
    chats.removeFromGroup(chatId, UNSUBSCRIBE_GROUP);
    await this.sendMsg(chatId, subscribeMsg);
  }

  async onUnsubscribeCmd(chatId){
    chats.addToGroup(chatId, UNSUBSCRIBE_GROUP);
    await this.sendMsg(chatId, unsubscribeMsg);
  }

  async onNotifyCmd(chatId, text){
    try{
      const isAdmin = await admin.isLogined(chatId);
      if(!isAdmin) return await this.sendMsg(chatId, sorryMsg);
      const msg = text.replace('/notify', '').trim();
      await this.notifySubscrUsersWithMsg(msg);
     }catch(e){
       log.err(e);
       await this.sendMsg(chatId, serviceErrMsg)
     }
  }

  async notifySubscrUsersWithMsg(msg){
    const subscrChats = await chats.getNotInGroup(UNSUBSCRIBE_GROUP);
    log(`sending notification with text: "${msg}", users: ${subscrChats.length}`);
    for(const subscrChatId of subscrChats){
      await this.sendMsg(subscrChatId, msg, {parse_mode: 'markdown'});
    }
  }

  // New movies

  async onCheckForNewMovies(){
    log('checking for new movies');
    const cinemasData = await this.getCachedCinemasData();
    const movies = moviesListFromCinemasData(cinemasData);
    const notNotifiedMovies = await moviesStore.filterNotNotified(movies);
    if(notNotifiedMovies.length){
      let msg = `З'явились нові фільми:${RN}`;
      for(const movie of notNotifiedMovies){
        msg += `${RN}- ${movie}`;
      }
      const adminChats = await admin.getChats();
      log(`sending information about new movies to ${adminChats.length} admins`);
      for(const adminChat of adminChats){
        await this.sendMsg(adminChat, msg);
      }
      await moviesStore.addToNotified(notNotifiedMovies);
    }else{
      log('new movies not found');
    }
  }

  // Bot

  async sendMsg(chatId, msg, opt){
    await this.tgbot.sendMessage(chatId, msg, opt);
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
