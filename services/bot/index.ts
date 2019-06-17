import TelegramBot, {
  ITGMessage, ITGSendMessageReducedOpt, ITGUpdate, strFromBotCmd, TGChatId,
} from 'lib/tgbot';
import { isArray } from 'lodash';
import { getCache, setCache } from 'services/cache';
import { Log, secondMs } from 'utils';
import { adminLogin, adminLogout, isAdmin } from './admin';
import { addToAllGroup, addToGroup, getNotInGroup, removeFromGroup } from './chatsStore';
import { cinemsDataToMsg, getCinemasData, moviesListFromCinemasData } from './cinemas';
import { addToNotifiedMovies, filterNotNotifiedMovies } from './moviesStore';
import {
  cmdParamErr, helpMsg, loginedMsg, logoutErrMsg, logoutMsg,
  serviceErrMsg, sorryMsg, startMsg, subscribeMsg, unsubscribeMsg,
} from './msg';
import { EStatsEvent, logEvent, statsMsgForPeriod } from './stats';

const ScheduleCacheKey = 'schedule';
const ScheduleCacheExp = 60 * 60;
const UnsubscribeGroup = 'unsubscribe';
const log = Log('cinemas.bot');

const clearMsg = (rawMsg?: string) => {
  if (!rawMsg) { return ''; }
  const msg = rawMsg.trim();
  return msg;
};

export default class CinemaBot {
  private cacheEnabled: boolean;
  private tgbot: TelegramBot;

  constructor(token: string, cacheEnabled: boolean = true) {
    this.cacheEnabled = cacheEnabled;
    this.tgbot = new TelegramBot(token);
  }

  public async processUpdate(data: ITGUpdate) {
    log.debug('processing update: ', data);
    if (data.message) {
      await this.processTextMsg(data.message);
    }
  }

  public async processTextMsg(message: ITGMessage) {
    log.debug('message received: ', message);
    const chatId = message.chat.id;
    const text = clearMsg(message.text);

    log.debug(`(${chatId}) ${text}`);
    addToAllGroup(chatId);
    try {
      if (text.indexOf('/start') === 0) {
        await this.onStartCmd(chatId, text);
        logEvent(EStatsEvent.Start);
      } else if (text.indexOf('/help') === 0) {
        await this.onHelpCmd(chatId);
        logEvent(EStatsEvent.Help);
      } else if (text.indexOf('/schedule') === 0) {
        await this.onScheduleCmd(chatId);
        logEvent(EStatsEvent.Get);
      } else if (text.indexOf('/subscribe') === 0) {
        await this.onSubscribeCmd(chatId);
        logEvent(EStatsEvent.Subscribe);
      } else if (text.indexOf('/unsubscribe') === 0) {
        await this.onUnsubscribeCmd(chatId);
        logEvent(EStatsEvent.Unsubscribe);
      } else if (text.indexOf('/notify') === 0) {
        await this.onNotifyCmd(chatId, text);
      } else if (text.indexOf('/stats') === 0) {
        await this.onStatsCmd(chatId, text);
      } else if (text.indexOf('/logout') === 0) {
        await this.onLogoutCmd(chatId);
      } else {
        await this.sendMsg(chatId, sorryMsg);
      }
    } catch (err) {
      log.err(err);
      await this.sendMsg(chatId, serviceErrMsg);
    }
  }

  public async onStartCmd(chatId: TGChatId, text: string) {
    if (text === '/start') {
      await this.sendMsg(chatId, startMsg);
    } else {
      const regex = /\/start ([\w\d_-]+)/g;
      const match = regex.exec(text);
      if (!match) { return this.sendMsg(chatId, startMsg); }
      const accessToken = match[1];
      const isLogined = await adminLogin(chatId, accessToken);
      if (!isLogined) {
        await this.sendMsg(chatId, startMsg);
      } else {
        await this.sendMsg(chatId, loginedMsg);
      }
    }
  }

  public async onStatsCmd(chatId: TGChatId, text: string) {
   try {
    if (!await isAdmin(chatId)) { return await this.sendMsg(chatId, sorryMsg); }
    const period = strFromBotCmd(text) || 'week';
    if (['day', 'week', 'month', 'year'].indexOf(period) === -1) {
      return await this.sendMsg(chatId, cmdParamErr);
    }
    const msg = await statsMsgForPeriod(period);
    await this.sendMsg(chatId, msg, { parse_mode: 'Markdown' });
   } catch (e) {
     log.err(e);
     await this.sendMsg(chatId, serviceErrMsg);
   }
  }

  public async onLogoutCmd(chatId: TGChatId) {
    try {
      if (!await isAdmin(chatId)) { return await this.sendMsg(chatId, sorryMsg); }
      const isLogouted = await adminLogout(chatId);
      if (!isLogouted) { return await this.sendMsg(chatId, logoutErrMsg); }
      await this.sendMsg(chatId, logoutMsg);
     } catch (e) {
       log.err(e);
       await this.sendMsg(chatId, serviceErrMsg);
     }
  }

  public async onHelpCmd(chatId: TGChatId) {
    await this.sendMsg(chatId, helpMsg, {disable_web_page_preview: true});
  }

  public async onScheduleCmd(chatId: TGChatId) {
    // Try to get schedule
    try {
      const cinemasData = await this.getCachedCinemasData();
      log.trace(cinemasData);
      // Reply
      const cinemasMsg = cinemsDataToMsg(cinemasData);
      await this.sendMsg(chatId, cinemasMsg, { parse_mode: 'Markdown', disable_web_page_preview: true });
    } catch (err) {
      // Log problems
      log.err(err);
      await this.sendMsg(chatId, serviceErrMsg);
    }
  }

  // Subscriptions

  public async onSubscribeCmd(chatId: TGChatId) {
    removeFromGroup(chatId, UnsubscribeGroup);
    await this.sendMsg(chatId, subscribeMsg);
  }

  public async onUnsubscribeCmd(chatId: TGChatId) {
    addToGroup(chatId, UnsubscribeGroup);
    await this.sendMsg(chatId, unsubscribeMsg);
  }

  public async onNotifyCmd(chatId: TGChatId, text: string) {
    try {
      if (!await isAdmin(chatId)) { return await this.sendMsg(chatId, sorryMsg); }
      const msg = text.replace('/notify', '').trim();
      await this.notifySubscrUsersWithMsg(msg);
     } catch (e) {
       log.err(e);
       await this.sendMsg(chatId, serviceErrMsg);
     }
  }

  public async notifySubscrUsersWithMsg(msg: string) {
    const subscrChats = await getNotInGroup(UnsubscribeGroup);
    log.debug(`sending notification with text: "${msg}", users: ${subscrChats.length}`);
    for (const subscrChatId of subscrChats) {
      try {
        await this.sendMsg(subscrChatId, msg, {parse_mode: 'Markdown'});
      } catch (err) {
        log.err(err);
      }
    }
  }

  // New movies

  public async onCheckForNewMovies() {
    log.debug('checking for new movies');
    const cinemasData = await this.getCachedCinemasData();
    const movies = moviesListFromCinemasData(cinemasData);
    const notNotifiedMovies = await filterNotNotifiedMovies(movies);
    if (notNotifiedMovies.length) {
      let msg = ``;
      for (const movie of notNotifiedMovies) {
        msg +=  !msg ? `"${movie}"` : `, "${movie}"`;
      }
      msg = `🔥${msg} вже у кіно! Переглянути розклад: /schedule`;
      await this.notifySubscrUsersWithMsg(msg);
      await addToNotifiedMovies(notNotifiedMovies);
    } else {
      log.debug('new movies not found');
    }
  }

  // Bot

  public async sendMsg(chatId: TGChatId, msg: string, opt?: ITGSendMessageReducedOpt) {
    await this.tgbot.sendTextMessage(chatId, msg, opt);
  }

  // Data

  public async getCachedCinemasData() {
    if (!this.cacheEnabled) {
      log.debug(`cache disabled, loading cinemas data from api`);
      return getCinemasData();
    }
    const cachedData = await getCache(ScheduleCacheKey);
    if (cachedData && isArray(cachedData) && cachedData.length) {
      log.debug(`loading cinemas data from cache`);
      return cachedData;
    }
    log.debug(`loading cinemas data from api`);
    const data = await getCinemasData();
    log.debug(`saving data to cache`);
    setCache(ScheduleCacheKey, data, ScheduleCacheExp);
    return data;
  }

}
