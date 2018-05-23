'use strict';

const request = require('request');

const requestPromisse = (opt) => new Promise((resolve, reject) => {
  request(opt, (err, res, body) => {
    if(err){
      reject(err.toString());
    }else{
      if(res.statusCode > 299){
        const descr = res.statusCode + (body ? ': ' + body : '');
        reject({code: res.statusCode, name: 'HTTP_WRONG_STATUS_CODE', descr});
      }else{
        resolve({res, body});
      }
    }
  });
});

module.exports = {
  requestPromisse,
};
