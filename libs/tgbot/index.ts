import request, { CoreOptions, Response, UriOptions, UrlOptions } from 'request';
import { ITGSendMessageOpt, ITGSendMessageReducedOpt } from './types';

type ReqOpt = (UriOptions & CoreOptions) | (UrlOptions & CoreOptions);

export const asyncReq = (opt: ReqOpt): Promise<{ res: Response, body: any }> => (
  new Promise((resolve, reject) => {
    request(opt, (err, res, body) => {
      if (err) {
        reject({name: 'HTTP_REQ_ERR', descr: err.toString()});
      } else {
        if (res.statusCode > 299) {
          const name = 'HTTP_WRONG_STATUS_CODE';
          const descr = res.statusCode + (body ? ': ' + body : '');
          reject({ code: res.statusCode, name, descr });
        } else {
          resolve({ res, body });
        }
      }
    });
  })
);

const asyncReqData = async (opt) => {
  const { res, body } = await asyncReq(opt);
  const { statusCode } = res;
  if ((statusCode < 200) || (statusCode > 299)) {
    throw new Error(`Wrong status code: ${statusCode}, body: ${body}`);
  }
  if (body.ok === true) {
    return body.result;
  }
  if (body.ok === false) {
    throw new Error(body.description);
  } else {
    throw new Error(`Unknow error: ${body.toString ? body.toString() : body}`);
  }
};

export const strFromBotCmd = (text: string): string | null => {
  const regex = /\/[\w\d_-]+ ([\w\d_-]+)/g;
  const match = regex.exec(text);
  return match ? match[1] : null;
};

export default class TelegramBot {
  public static strFromCmd(text) {
    const regex = /\/[\w\d_-]+ ([\w\d_-]+)/g;
    const match = regex.exec(text);
    return match ? match[1] : null;
  }

  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  public async getMe() {
    return this.apiReq({ method: 'getMe' });
  }

  public async sendTextMessage(chat_id: number | string, text: string, opt?: ITGSendMessageReducedOpt) {
    if (!chat_id) { throw new Error('chat_id required'); }
    const data: ITGSendMessageOpt = opt ? { chat_id, text, ...opt } : { chat_id, text };
    return this.sendMessage(data);
  }

  public async sendMessage(data: ITGSendMessageOpt) {
    return this.apiReq({ method: 'sendMessage', data });
  }

  public async apiReq({ method, data }: { method: string, data?: any }) {
    const url = `https://api.telegram.org/bot${this.token}/${method}`;
    if (!data) {
      return asyncReqData({method: 'GET', url, json: true});
    }
    const headers = {
      'Content-Type': 'application/json',
    };
    return asyncReqData({method: 'POST', url, headers, json: data});
  }

}

export * from './types';
