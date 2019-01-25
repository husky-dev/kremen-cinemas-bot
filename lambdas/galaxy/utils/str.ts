import { isError, isFunction, isNumber, isString } from 'lodash';

export const RN = '\r\n';
export const DRN = `${RN}${RN}`;

export const errToStr = (err: any) => {
  if (!err) { return 'Error: empty error'; }
  if (isError(err)) { return err.toString(); }
  if (isString(err)) { return err; }
  if (isNumber(err)) { return `${err}`; }
  if (isFunction(err.toString)) { return err.toString(); }
  return 'Error: unknow error';
};

export const pad = (n: number, width: number = 2, z: string = '0')  => {
  const nStr = n.toString();
  return nStr.length >= width ? nStr : new Array(width - nStr.length + 1).join(z) + nStr;
};
