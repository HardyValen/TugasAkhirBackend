require("dotenv").config()

const morgan    = require("morgan");
const winston   = require("winston");

// Logging
function HTTPLogger(env) {
  if (env == "production") {
    return morgan(function(tokens, req, res) {
      return [
        `[${date}]`,
        tokens.method(req, res),
        tokens.url(req, res),
        tokens.status(req, res),
        tokens['response-time'](req, res), "ms"
      ].join(' ')
    }
    );
  } else {
    return morgan("dev");
  }
} 

module.exports = HTTPLogger;