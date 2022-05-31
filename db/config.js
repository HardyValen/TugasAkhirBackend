require("dotenv").config();

var mongoose  = require("mongoose");
const commonLogger = require("../logfiles/commonLogger");

var db = mongoose.connection;

module.exports = mongoose.connect(process.env.DB_URL_COMPLETE)
.then(() => {
  commonLogger.info(`Successfully connected to DB ${db.name}`, {context: "mongo"});
})
.catch(e => {
  commonLogger.error(`Error connecting to DB\n${e.message}`, {context: "mongo"})
});