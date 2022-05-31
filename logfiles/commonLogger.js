const winston = require("winston");
const path    = require("path");
const SETTINGS = require("../settings");

const loggerCommonFormat = winston.format.combine(
  winston.format.splat(),
  winston.format.json(),
  winston.format.ms(),
  winston.format.printf(({context, message, level, service, type, serverID, ms}) => {
    return `[${new Date(Date.now())}] [${context}-${level}] : ${message} { ${service}, ${serverID}, ${type} } - ${ms}`
  })
);

const commonLogger = winston.createLogger({
  format: loggerCommonFormat,
  defaultMeta: { 
    service: 'video-backend-service',
    type: 'common',
    serverID: process.env.SERVER_ID,
    context: "others"
  }
})

if (process.env.ENV == "production") {
  commonLogger.add( new winston.transports.File({
    filename: path.join(SETTINGS.COMMON_LOG_DIR, "error.log"), 
    level: "error"
  }))
  commonLogger.add( new winston.transports.File({
    filename: path.join(SETTINGS.COMMON_LOG_DIR, "info.log"), 
    level: "info"
  }))
} else {
  commonLogger.add(new winston.transports.Console())
}

module.exports = commonLogger;