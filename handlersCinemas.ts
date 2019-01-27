import { APIGatewayProxyHandler } from 'aws-lambda';
import { getGalaxyCinema } from 'parsers/index';
import { okResp, serverErrResp } from 'utils';

export const galaxy: APIGatewayProxyHandler = async (_event, _context) => {
  try {
    return okResp(await getGalaxyCinema());
  } catch (err) {
    return serverErrResp(err);
  }
};
