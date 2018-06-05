'use strict';

const logDebug = (...args) => console.log(...args);
const logErr = (...args) => console.error(...args);

function mainLog(...args){
  logDebug(...args);
}

mainLog.err = logDebug;
mainLog.err = logErr;

module.exports = mainLog;