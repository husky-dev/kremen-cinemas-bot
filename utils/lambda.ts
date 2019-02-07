import aws, { Lambda } from 'aws-sdk';
import { isString } from 'lodash';

const lambda = new aws.Lambda({ region: 'us-east-1' });

const invokeLambda = async (params: Lambda.Types.InvocationRequest) => (
  new Promise<Lambda.Types.InvocationResponse>((resolve, reject) => (
    lambda.invoke(params, (err, data) => err ? reject(err) : resolve(data))
  ))
);

const getJsonDataFromLambda =  async (params: Lambda.Types.InvocationRequest) => {
  const { StatusCode, Payload } = await invokeLambda(params);
  if (StatusCode !== 200) { throw new Error(`Wrong lambda response status code: ${StatusCode}`); }
  if (!isString(Payload)) { throw new Error(`Wrong lambda response payload format`); }
  try {
    return JSON.parse(Payload);
  } catch (err) {
    throw new Error('Parsing lamda payload err');
  }
};

export const getDataBodyFromLambda = async (params: Lambda.Types.InvocationRequest) => {
  const resp = await getJsonDataFromLambda(params);
  if (!resp) { throw new Error('Lambda response is empty'); }
  if (!resp.body) { throw new Error('Lambda response resp.body is empty'); }
  if (!isString(resp.body)) { throw new Error('Lambda response resp.body is not a string'); }
  try {
    return JSON.parse(resp.body);
  } catch (err) {
    throw new Error('Parsing lamda resp.body err');
  }
};
