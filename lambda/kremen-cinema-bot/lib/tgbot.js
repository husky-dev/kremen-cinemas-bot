'use strict';

const { asyncReq } = require('./async');

const asyncReqData = async (opt) => {
  const { response, body } = await asyncReq(opt);
  const { statusCode } = response;
  if((statusCode < 200) || (statusCode > 299)){
    throw new Error(`Wrong status code: ${statusCode}, body: ${body}`);
  }
  if(body.ok === true){
    return body.result;
  }else if(body.ok === false){
    throw new Error(body.description);
  }else{
    throw new Error(`Unknow error: ${body}`);
  }
}

class TelegramBot{
  constructor(token){
    if(!token){
      throw new Error('Telegram Bot token required');
    }
    this.token = token;
  }

  async apiReq({ method, data }){
    const url = `https://api.telegram.org/bot${this.token}/${method}`;
    if(!data){
      return asyncReqData({method: 'GET', url, json: true});
    }
    const headers = {
      'Content-Type': 'application/json',
    };
    return asyncReqData({method: 'POST', url, headers, json: data});
  }

  async getMe(){
    return this.apiReq({ method: 'getMe' });
  }

  async sendMessage(chat_id, text, opt){
    if(!chat_id) throw new Error('chat_id required');
    const data = opt ? { chat_id, text, ...opt } : { chat_id, text };
    return this.apiReq({ method: 'sendMessage', data });
  }

}

module.exports = TelegramBot;
