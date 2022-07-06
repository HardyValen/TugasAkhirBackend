require("dotenv").config();

var mongoose        = require("mongoose");
const commonLogger  = require("../logfiles/commonLogger");
const fs            = require("fs");
const path          = require("path");
const SETTINGS      = require("../settings");
const { videoModel } = require("./schema/video");

var db = mongoose.connection;

module.exports = {
  status: db,
  dbconnect: function() {
    mongoose.connect(process.env.DB_URL_COMPLETE)
    .then(() => {
      commonLogger.info(`Successfully connected to DB ${db.name}`, {context: "mongo"});
      
      // clean .tmp if started
      let outputDir = path.join(SETTINGS.PROJECT_DIR, ".tmp/output")
      let sourceDir = path.join(SETTINGS.PROJECT_DIR, ".tmp/source")
      let fileList = [];

      if (fs.existsSync(sourceDir)) {
        let sourceFileList = fs.readdirSync(sourceDir);
        sourceFileList = sourceFileList.map(x => x.split(".")[0])
        fileList = fileList.concat(sourceFileList);
        fs.rmdirSync(sourceDir, {recursive: true})
        fs.mkdirSync(path.join(SETTINGS.PROJECT_DIR, ".tmp/source"), {recursive: true});
        fs.chmodSync(path.join(SETTINGS.PROJECT_DIR, ".tmp/source"), 0777);
      }

      if (fs.existsSync(outputDir)) {
        let outputFileList = fs.readdirSync(outputDir)
        fileList = fileList.concat(outputFileList);
        fileList = fileList.filter((item, index) => fileList.indexOf(item) == index);
        fs.rmdirSync(outputDir, {recursive: true})
        fs.mkdirSync(path.join(SETTINGS.PROJECT_DIR, ".tmp/output"), {recursive: true});
        fs.chmodSync(path.join(SETTINGS.PROJECT_DIR, ".tmp/output"), 0777);
      }

      // because files in filename format, get basename format for it
      fileList = fileList.map(x => path.basename(x))
      videoModel.remove(
        {
          objectname: { $in: fileList },
        }
      , (err) => {
        if (err) {
          commonLogger.error("Error when removing orphaned entries", {context: "mongo"})
        }
      })
    })
    .catch(e => {
      commonLogger.error(`Error connecting to DB\n${e.message}`, {context: "mongo"})
    });
  }
}