require("dotenv").config();

const express         = require("express");
const path            = require("path");
const { videoModel }  = require("../db/schema/video");
const minioClient     = require("../minio-client/config");
const crypto          = require("crypto");
const fs              = require("fs");
const SETTINGS        = require("../settings");
const commonLogger    = require("../logfiles/commonLogger");

const router          = express.Router();

router.get(
  "/",
  async function(req, res) {
    try {
      let id = req.query.id;
      if (!id) {
        res.status(404).send("File not found")
      } else {
        videoModel.findById(id, function (err, doc) {        
          if (err) {
            commonLogger.error(`${err.message}`, {context: "minio"});
            res.status(500).send("Internal server error");
          } else {
            // if null
            if (!doc) {
              res.status(404).send("File not found")
            } else {
              // if not Streamable
              if (~~(doc.videoStatus.code / 2000) == 2) {
                res.status(404).send(doc.videoStatus.message)
              } else {
                let objectName = `${doc.objectname}/${doc.objectname}.mpd`;
  
                let tmpName = crypto.createHash('sha1').update(`${Date.now()}-${Math.random()}`).digest("hex").toString();
                let outputDir = path.join(SETTINGS.PUBLIC_DIR, `videos/${tmpName}`);
                let outputFile = path.join(outputDir, `${tmpName}`)
  
                // if (!fs.existsSync()) {
                  fs.mkdirSync(outputDir);
                  fs.chmodSync(outputDir, 0777);
                // }
                
                minioClient.fGetObject(
                  process.env.MINIO_VIDEO_BUCKET_NAME,
                  objectName,
                  outputFile,
                  async (err) => {
                    if (err) {
                      commonLogger.log(err, {context: "vod"})
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
      }
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
    console.log(chunkName);

    let parentObj = chunkName.split("-")[0];
    let objectName = `${parentObj}/${req.params[0]}.m4s`;

    let tmpName = crypto.createHash('sha1').update(`${Date.now()}-${Math.random()}`).digest("hex").toString();
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
          res.status(404).send("File not found")
          fs.rmdirSync(outputDir, { recursive: true });
        } else {
          res.status(200).sendFile(outputFile, () => {
            fs.rmdirSync(outputDir, { recursive: true });
          });
        }
      }
    )
  }
)

router.get("/results", (req, res) => {
  let quantity = parseInt(req.query.quantity)
  let searchQuery = req.query.search_query

  if (!quantity || isNaN(quantity)) {
    quantity = 10
  }

  let mongoQuery = {
    "videoStatus.code": 2000
  }

  if (searchQuery) {
    mongoQuery.fieldname = searchQuery
  }

  if (quantity < 0) {
    videoModel.find(mongoQuery)
    .sort({"updated_At": -1})
    .exec(function (err, doc) {
      if (err) {
        commonLogger.error(`${err.message}`, {context: "mongo"});
        res.status(404).send("Internal server error");
      } else {
        res.status(200).json(doc)
      }
    })
  } else {
    videoModel.find(mongoQuery)
    .sort({"updated_At": -1})
    .limit(quantity)
    .exec(function (err, doc) {
      if (err) {
        commonLogger.error(`${err.message}`, {context: "mongo"});
        res.status(404).send("Internal server error");
      } else {
        res.status(200).json(doc)
      }
    })
  }
})

router.put("/", (req, res) => {
  let videoID = req.body.id
  let fieldname = req.body.fieldname
  let videoDescription = req.body.videoDescription

  if (!videoID) {
    res.status(404).send("Entry not found")
  } else {
    let updateQuery = {
      updatedAt: Date.now()
    }
  
    if (fieldname) {
      updateQuery.fieldname = fieldname
    }
  
    if (videoDescription) {
      updateQuery.videoDescription = videoDescription
    }
  
    videoModel.findByIdAndUpdate(videoID, updateQuery, function (err, doc) {
      if (err) {
        commonLogger.error(`${err.message}`, {context: "mongo"});
        res.status(500).send("Internal server error");
      } else {
        if (!doc) {
          res.status(404).send("Entry not found")
        } else {
          res.status(200).json(doc);
        }
      } 
    }) 
  }
})

module.exports = router;