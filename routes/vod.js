require("dotenv").config();

const express         = require("express");
const path            = require("path");
const { videoModel }  = require("../db/schema/video");
const minioClient     = require("../minio-client/config");
const crypto          = require("crypto");
const fs              = require("fs");

const router    = express.Router();

router.get(
  "/*.mpd",
  async function(req, res) {
    console.log(req.params[0])
    try {
      videoModel.findOne({ fieldname: req.params[0] }, function (err, doc) {
        if (err) {
          console.error(`[MINIO-ERROR] ${error.message}`);
          res.status(500).send("Internal server error");
        } else {
          // if null
          if (!doc) {
            res.status(404).send("File not found")
          } else {
            console.log(doc)

            // if not Streamable
            if (!doc.isStreamable) { 
              res.status(410).send("Video you've requested is not yet streamable")
            }

            // if failed flag set to true
            else if (doc.isFailed) { 
              res.status(410).send(`Video you've requested is failed to played properly because of ${doc.errorMessage}`);
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
                    console.log(err)
                    res.status(500).send("Internal server error")
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
      console.error(`[GET-ERROR] ${error.message}`);
      res.status(500).send("Internal server error");
    }
  }
)

router.get(
  "/*.m4s",
  async function(req, res) {
    let chunkName = req.params[0];
    console.log(req.headers);
    
    let parentObj = chunkName.split("-")[0];
    let objectName = `${parentObj}/${req.params[0]}.m4s`;
    console.log(parentObj)

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
          console.log(err)
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