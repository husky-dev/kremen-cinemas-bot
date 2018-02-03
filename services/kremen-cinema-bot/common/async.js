// Require
const request = require('request');
const { errors } = require('./consts');

// Express

const asyncWrap = fn => (req, res, next) => {
	Promise
	  .resolve(fn(req, res, next))
	  .catch((err) => res.err(err));
};

// Request

const requestPromisse = (opt) => new Promise((resolve, reject) => {
  request(opt, (err, res, body) => {
    if(err){
      reject({name: errors.HTTP_REQ_ERR, descr: err.toString()});
    }else{
      if(res.statusCode > 299){
        const name = errors.HTTP_WRONG_STATUS_CODE;
        const descr = res.statusCode + (body ? ': ' + body : '');
        reject({code: res.statusCode, name, descr});
      }else{
        resolve({res, body});
      }
    }
  });
});

// Export

module.exports = {
  asyncWrap,
  requestPromisse,
};