// Errors

const errors = {
  // Basic error
  UNKNOW_ERR: "UNKNOW_ERR",
  // HTTP
  HTTP_WRONG_STATUS_CODE: "HTTP_WRONG_STATUS_CODE",
  HTTP_REQ_ERR: "HTTP_REQ_ERR",
  // Basic API errors
  API_IN_DEV: "API_IN_DEV",
  UNKNOW_API_ENDPOINT: "UNKNOW_API_ENDPOINT",
  // API request errors
  REQ_PARAM_MISSED: "REQ_PARAM_MISSED",
  REQ_BODY_EMPTY: "REQ_BODY_EMPTY",
  REQ_BODY_FORMAT_ERR: "REQ_BODY_FORMAT_ERR",
  // Services errors
  SERVICE_ERR: "SERVICE_ERR",
  SERVICE_RESPONSE_ERR: "SERVICE_RESPONSE_ERR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE_ERR",
  // HTML parser erros
  ENCODING_CONVERSION_ERR: "ENCODING_CONVERSION_ERR",
  // Posts parser errors
  ADAPTER_NOT_FOUND: "ADAPTER_NOT_FOUND",
  NOT_POST_URL: "NOT_POST_URL",
  POST_PARSE_ERR: "POST_PARSE_ERR",
  HTML_PARSE_ERR: "HTML_PARSE_ERR",
  // Posts storage errors
  DB_REQ_ERR: "DB_REQ_ERR",
  POST_NOT_FOUND: "POST_NOT_FOUND",
  SEARCH_INDEX_ERR: "SEARCH_INDEX_ERR",
  // Info widges
  XML_PARSING_ERR: "XML_PARSING_ERR",
  WEATHER_PARSING_ERR: "WEATHER_PARSING_ERR"
};

// Codes

const codes = {
  OK: 200,

  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  UNPROCESSABLE_ENTITY: 422,

  SERVER_ERR: 503
}

// Helpers

codes.errNameToCode = (name) => {
  switch (name) {
    case errors.UNKNOW_ERR: return codes.SERVER_ERR;

    case errors.HTTP_WRONG_STATUS_CODE: return codes.UNPROCESSABLE_ENTITY;
    case errors.HTTP_REQ_ERR: return codes.UNPROCESSABLE_ENTITY;

    case errors.API_IN_DEV: return codes.UNPROCESSABLE_ENTITY;
    case errors.UNKNOW_API_ENDPOINT: return codes.UNPROCESSABLE_ENTITY;

    case errors.REQ_PARAM_MISSED: return codes.BAD_REQUEST;
    case errors.REQ_BODY_EMPTY: return codes.BAD_REQUEST;
    case errors.REQ_BODY_FORMAT_ERR: return codes.BAD_REQUEST;

    case errors.SERVICE_ERR: return codes.SERVER_ERR;
    case errors.SERVICE_RESPONSE_ERR: return codes.SERVER_ERR;
    case errors.SERVICE_UNAVAILABLE: return codes.SERVER_ERR;

    case errors.ENCODING_CONVERSION_ERR: return codes.UNPROCESSABLE_ENTITY;

    case errors.ADAPTER_NOT_FOUND: return codes.NOT_FOUND;
    case errors.NOT_POST_URL: return codes.UNPROCESSABLE_ENTITY;
    case errors.POST_PARSE_ERR: return codes.UNPROCESSABLE_ENTITY;
    case errors.HTML_PARSE_ERR: return codes.UNPROCESSABLE_ENTITY;

    case errors.DB_REQ_ERR: return codes.UNPROCESSABLE_ENTITY;
    case errors.POST_NOT_FOUND: return codes.NOT_FOUND;
    case errors.SEARCH_INDEX_ERR: return codes.UNPROCESSABLE_ENTITY;

    case errors.XML_PARSING_ERR: return codes.SERVER_ERR;
    case errors.WEATHER_PARSING_ERR: return codes.SERVER_ERR;

    default: return codes.SERVER_ERR;
  }
}

// Exports

module.exports = {
  errors,
  codes
}
