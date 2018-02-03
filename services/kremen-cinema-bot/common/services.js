// Require
const { requestPromisse } = require('./async.js');
const _ = require('lodash');
// Consts
const {errors, codes} = require('./consts.js');
const MAX_TRYS_COUNT = 3;

// Helpers
const timeout = (ms) => (
  new Promise(resolve => setTimeout(resolve, ms))
);

const galaktikaApiReq = ({method, path, data}) => (
  serviceApiReqWithTrys({method, path, data, host: 'cinema-galaktika'})
);

// Calling service API

const serviceApiReqWithTrys = async (opt, trysCount = 0) => {
  try{
    return await serviceApiReq(opt);
  }catch(err){
    if(err.name !== errors.SERVICE_UNAVAILABLE){
      throw err;
    }
    if(trysCount >= MAX_TRYS_COUNT){
      throw err;
    }
    await timeout(3000);
    return await serviceApiReqWithTrys(opt, (trysCount + 1));
  }
}

const serviceApiReq = async ({method = 'GET', host = '', port = '8080', path = '', data = {}}) => {
  let reqOpt = {};
  reqOpt.method = method;
  reqOpt.url = 'http://' + host + ':' + port + path;
  if(method.toLocaleLowerCase() === 'get'){
    reqOpt.qs = data;
  }else{
    reqOpt.json = data;
  }
  try{
    let {res, body} = await requestPromisse(reqOpt);
    // Try to parse data
    if(body && _.isString(body)){
      body = parseApiRespData(body);
    }
    // Return data if everything ok with status code
    if(res.statusCode < 299) return body;
    // Processing errors
    if(!body){
      // Without data
      const code = res.statusCode;
      const name = errNameForHTTPCode(code);
      throw {code, name};
    }else{
      // With data
      let err = data;
      err.code = res.statusCode;
      throw err;
    }
  }catch(err){
    if(err.code == 'ENOTFOUND'){
      throw {code: codes.SERVER_ERR, name: errors.SERVICE_UNAVAILABLE, descr: 'Cannot reach service: ' + host};
    }else{
      throw err;
    }
  }
}

const parseApiRespData = (text) => {
  let data = null;
  try {
    data = JSON.parse(text);
  }catch (error) {
    // Setting text if it's problem to parse data
    data = {descr: text};
  }
  return data;
}

const errNameForHTTPCode = (code) => {
  let name = undefined;
  Object.keys(errors).forEach(errName => {
    if(errors[errName] == code){
      name = errName;
    }
  });
  return name;
}

// Exports

module.exports = {
  galaktika: {
    getSchedule: () => galaktikaApiReq({path: '/schedule'}),
  },
}