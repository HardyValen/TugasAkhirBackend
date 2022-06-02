require("dotenv").config()

const morgan    = require("morgan");
const fs        = require("fs");
const path      = require("path");
const SETTINGS  = require("../settings");
const commonLogger = require("./commonLogger");
const refreshLog = require("./refreshLog");
const { ToadScheduler, SimpleIntervalJob, Task } = require("toad-scheduler");

// Logging
function HTTPLogger(env) {
  if (env == "production") {
    let httpLogStreamPath = path.join(SETTINGS.HTTP_LOG_DIR, "access.log");
    
    const scheduler = new ToadScheduler();
    const task = new Task("monthly-http-logger-task", () => {
      console.log("monthly-http-logger-task successfully executed")
      let bucketLocation = path.join(process.env.SERVER_ID, "http", `${Date.now()}.log`);
      refreshLog(httpLogStreamPath, bucketLocation, (error) => {
        if (error) {
          commonLogger.error(error.message, {context: `httplogger`})
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
    
    let httpLogStream = fs.createWriteStream(httpLogStreamPath, { flags: "a" });
    
    return morgan(function(tokens, req, res) {
      return [
        `[${new Date(Date.now())}]`,
        tokens.method(req, res),
        tokens.url(req, res),
        tokens.status(req, res),
        tokens['response-time'](req, res), "ms"
      ].join(' ')
    },
    { stream: httpLogStream }
    );
  } else {
    return morgan("dev");
  }
} 

module.exports = HTTPLogger;