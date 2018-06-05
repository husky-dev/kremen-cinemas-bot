'use strict';

const TelegramBot = require('./tgbot');
const log = require('./log');

class CinemaBot{
  constructor(token){
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
      await this.processMessage(data.message);
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
  async processMessage(message){
    log('message received: ', message);
    const chatId = message.chat.id;
    const text = message.text;
    await this.tgbot.sendMessage(chatId, `You just said "${text}"`);
  }
}

module.exports = CinemaBot;
