import { APIGatewayEvent, APIGatewayEventRequestContext } from 'aws-lambda';
import { getCinema } from './lib/parser.js';

process.env.PATH = process.env.PATH + ":" + process.env.LAMBDA_TASK_ROOT;

exports.handler = async (event: APIGatewayEvent, context: APIGatewayEventRequestContext) => {
  const data = await getCinema();
  return data;
};
