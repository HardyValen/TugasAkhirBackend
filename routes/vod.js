require("dotenv").config();

const express         = require("express");
const path            = require("path");
const { videoModel }  = require("../db/schema/video");
const minioClient     = require("../minio-client/config");
const crypto          = require("crypto");
const fs              = require("fs");
const SETTINGS        = require("../settings");
const commonLogger = require("../logfiles/commonLogger");

const router    = express.Router();

router.get(
  "/*.mpd",
  async function(req, res) {
    try {
      videoModel.findOne({ fieldname: req.params[0] }, function (err, doc) {
        if (err) {
          commonLogger.error(`${error.message}`, {context: "minio"});
          res.status(500).send("Internal server error");
        } else {
          // if null
          if (!doc) {
            res.status(404).send("File not found")
          } else {
            // if not Streamable
            if (~~(doc.videoStatus.code / 4000) != 2) {
              res.status(404).send(doc.videoStatus.message)
            } else {
              let objectName = `${doc.objectname}/${doc.objectname}.mpd`;

              let tmpName = crypto.createHash('sha1').update(`${Date.now()}`).digest("hex").toString();
              let outputDir = path.join(SETTINGS.PUBLIC_DIR, `videos/${tmpName}`);
              let outputFile = path.join(outputDir, `${tmpName}`)

              fs.mkdirSync(outputDir);
              fs.chmodSync(outputDir, 0777);
              
              minioClient.fGetObject(
                process.env.MINIO_VIDEO_BUCKET_NAME,
                objectName,
                outputFile,
                async (err) => {
                  if (err) {
                    commonLogger.log(err, {context: "vod"})
                    res.status(404).send("Internal server error")
                  } else {
                    res.status(200).sendFile(outputFile, () => {
                      fs.rmdirSync(outputDir, { recursive: true });
                    });
                  }
                }
              )
            }
          }
        }
      })
    } catch (error) {
      commonLogger.error(`${error.message}`, {context: "vod"});
      res.status(500).send("Internal server error");
    }
  }
)

router.get(
  "/*.m4s",
  async function(req, res) {
    let chunkName = req.params[0];
    
    let parentObj = chunkName.split("-")[0];
    let objectName = `${parentObj}/${req.params[0]}.m4s`;

    let tmpName = crypto.createHash('sha1').update(`${Date.now()}`).digest("hex").toString();
    let outputDir = path.join(SETTINGS.PUBLIC_DIR, `videos/${tmpName}`);
    let outputFile = path.join(outputDir, `${tmpName}`)

    fs.mkdirSync(outputDir);
    fs.chmodSync(outputDir, 0777);
    
    minioClient.fGetObject(
      process.env.MINIO_VIDEO_BUCKET_NAME,
      objectName,
      outputFile,
      async (err) => {
        if (err) {
          commonLogger.error(err, {context: "minio"})
          res.status(500).send("Internal server error")
        } else {
          res.status(200).sendFile(outputFile, () => {
            fs.rmdirSync(outputDir, { recursive: true });
          });
        }
      }
    )
  }
)

module.exports = router;