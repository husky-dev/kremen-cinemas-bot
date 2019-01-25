import { isError, isFunction, isNumber, isString } from 'lodash';

export const okResp = (body: any, headers: any = {}) => ({
  body: JSON.stringify(body),
  headers,
  isBase64Encoded: false,
  statusCode: 200,
});

export const serverErrResp = (body: any) => ({
  body: JSON.stringify(body),
  headers: {},
  isBase64Encoded: false,
  statusCode: 503,
});

export const errToStr = (err: any) => {
  if (!err) { return 'Error: empty error'; }
  if (isError(err)) { return err.toString(); }
  if (isString(err)) { return err; }
  if (isNumber(err)) { return `${err}`; }
  if (isFunction(err.toString)) { return err.toString(); }
  return 'Error: unknow error';
};
