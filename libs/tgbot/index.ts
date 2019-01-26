import request, { CoreOptions, Response, UriOptions, UrlOptions } from 'request';

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

export type TGChatId = string | number;

export interface ITGUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface ITGChatPhoto {
  small_file_id?: string;
  big_file_id?: string;
}

export interface ITGChat {
  id: number;
  type: "private" | "group" | "supergroup" | "channel";
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  all_members_are_administrators?: boolean;
  photo?: ITGChatPhoto;
  description?: string;
  invite_link?: string;
  pinned_message?: ITGMessage;
  sticker_set_name?: string;
  can_set_sticker_set?: boolean;
}

export interface ITGMessage {
  message_id: number;
  from?: ITGUser;
  date: number;
  chat: ITGChat;
  forward_from?: ITGUser;
  forward_from_chat?: ITGChat;
  forward_from_message_id?: number;
  forward_signature?: string;
  forward_date?: number;
  reply_to_message?: ITGMessage;
  edit_date?: number;
  media_group_id?: string;
  author_signature?: string;
  text?: string;
}

export interface ITGUpdate {
  update_id: number;
  message?: ITGMessage;
}

export interface ITGSendMessageOpt {
  chat_id: TGChatId;
  text: string;
  parse_mode?: 'Markdown' | 'HTML';
  disable_web_page_preview?: boolean;
  disable_notification?: boolean;
  reply_to_message_id?: number;
}

export interface ITGSendMessageReducedOpt {
  parse_mode?: 'Markdown' | 'HTML';
  disable_web_page_preview?: boolean;
  disable_notification?: boolean;
  reply_to_message_id?: number;
}

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
