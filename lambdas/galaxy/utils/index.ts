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

export * from './date';
export { default as Log } from './log';
export * from './req';
export * from './str';
