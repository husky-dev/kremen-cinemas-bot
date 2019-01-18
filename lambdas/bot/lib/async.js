'use strict';

const request = require('request');

const asyncReq = (opt) => new Promise((resolve, reject) => {
  request(opt, (err, response, body) => {
    if(err){
      reject(err);
    }else{
      resolve({response, body});
    }
  });
});

module.exports = {
  asyncReq,
};
