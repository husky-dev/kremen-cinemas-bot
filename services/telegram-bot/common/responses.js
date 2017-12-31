// Conts
const {errors, codes} = require('./consts.js');

// Helpers
const objToStr = (obj) => {
  let str = null;
  try{
    str = JSON.stringify(obj);
  }catch(err){
    str = obj.toString();
  }
  return str;
}

const cloneObj = (obj) => {
  return Object.assign({}, obj);
}

// Exports
module.exports = (app, domain) => {
  // Custopm responses
  app.use((req, res, next) => {
    // Err response
    res.err = (err) => {
      if(!err){
        // Empty error
        return res.status(codes.SERVER_ERR).json({name: errors.UNKNOW_ERR, domain});
      }else if(err instanceof Error){
         // NodeJS Error
        let name = err.code;
        let descr = err.message;
        let code = codes.SERVER_ERR;
        if(name){
          code = codes.errNameToCode(name);
        }
        return res.status(code).json({name, descr, domain});
      }else if(err.name && err.code){
        // Error with name and code
        let data = cloneObj(err);
        data.domain = domain;
        delete data.code;
        return res.status(err.code).json(data);
      }else if(err.name){
        // Error with name
        let data = cloneObj(err);
        data.domain = domain;
        let code = codes.errNameToCode(err.name);
        return res.status(code).json(data);
      }else{
        // Unknow error
        let name = errors.UNKNOW_ERR;
        let descr = objToStr(err);
        let code = codes.errNameToCode(name);
        return res.status(code).json({name, descr, domain});
      }
    }
    // Reslut response
    res.result = (data) => {
      res.status(codes.OK).json(data);
    }

    next();
  });

  // Adding cusomt checks
  app.use((req, res, next) => {
    if(!req.query){
      req.query = {};
    }
    next();
  });

}
