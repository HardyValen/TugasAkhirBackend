const winston = require("winston");
const path    = require("path");
const SETTINGS = require("../settings");
const refreshLog = require("./refreshLog");
const { ToadScheduler, SimpleIntervalJob, Task } = require("toad-scheduler");

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
  let commonInfoLogPath = path.join(SETTINGS.COMMON_LOG_DIR, "error.log");
  let commonErrorLogPath = path.join(SETTINGS.COMMON_LOG_DIR, "info.log");

  commonLogger.add( new winston.transports.File({
    filename: commonInfoLogPath, 
    level: "error"
  }))
  commonLogger.add( new winston.transports.File({
    filename: commonErrorLogPath, 
    level: "info"
  }))

  const scheduler = new ToadScheduler();
  const task = new Task("monthly-common-logger-task", () => {
    let date = Date.now();
    let commonErrorBucketLocation = path.join(process.env.SERVER_ID, "common", "error", `${date}.log`);
    let commonInfoBucketLocation = path.join(process.env.SERVER_ID, "common", "info", `${date}.log`);

    console.log("monthly-http-common-task successfully executed")
    refreshLog(commonInfoLogPath, commonInfoBucketLocation, (error) => {
      if (error) {
        commonLogger.error(error.message, {context: `commonlogger`})
      }
    })
  
    refreshLog(commonErrorLogPath, commonErrorBucketLocation, (error) => {
      if (error) {
        commonLogger.error(error.message, {context: `commonlogger`})
      }
    })
  })

  const job = new SimpleIntervalJob(
    {
      days: 1,
      runImmediately: true,
    },
    task,
    'monthly-common-logger-job' 
  )

  scheduler.addIntervalJob(job);
  
} else {
  commonLogger.add(new winston.transports.Console())
}

module.exports = commonLogger;