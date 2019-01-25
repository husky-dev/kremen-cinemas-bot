import { APIGatewayProxyHandler } from 'aws-lambda';
import { getCinema } from 'lib/parser';
import { okResp, serverErrResp } from 'lib/utils';

export const cinemasGalaxy: APIGatewayProxyHandler = async (_event, _context) => {
  try {
    return okResp(await getCinema());
  } catch(err) {
    return serverErrResp(err);
  }
};
