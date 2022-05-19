require("dotenv").config();

const express       = require("express");
const path          = require("path");
const multer        = require("multer");
const {v4: uuidv4}  = require("uuid");
const mime          = require("mime-types");
const {videoModel}  = require("../db/schema/video");
const minioClient   = require("../minio-client/config");
const fs            = require("fs");
// const { createFFmpeg, fetchFile } = require("@ffmpeg/ffmpeg");
const morgan = require("morgan");

var router    = express.Router();

// Disk Storage
var storage   = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(SETTINGS.PUBLIC_DIR, ".tmp/source"))
  },
  filename: function(req, file, cb) {
    let extension = mime.extension(file.mimetype);
    cb(null, `${uuidv4()}-${Date.now()}.${extension}`)
  }
})

// Memory Storage
// var storage   = multer.memoryStorage();

var upload    = multer({
  storage     : storage,
  fileFilter  : function(req, file, cb) {
    checkFileType(file, cb);
  }
});

function checkFileType(file, cb){
  const filetypes = SETTINGS.ACCEPTED_VIDEO_FORMATS;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(mime.extension(file.mimetype));

  if(mimetype && extname){
    return cb(null,true);
  } else {
    cb('Error: Videos Only!');
  }
}

router.get("/minio-status", function(req, res, next) {
  minioClient.listBuckets()
    .then((data) => {
      res.send(JSON.stringify(data));
    })
    .catch((e) => {
      res.status(500).send(JSON.stringify(e.message))
    });
})

router.get("/", function(req, res, next) {
  res.sendFile(path.join(SETTINGS.PUBLIC_DIR, "upload-video.html"));
});

// Disk Storage
router.post(
  "/",  
  upload.single('video'),
  function(req, res, next) {
    let tmpName = `${uuidv4()}-${Date.now()}`;

    let tmpSource = path.join(SETTINGS.PROJECT_DIR, `.tmp/source/${req.file.filename}`);
    let tmpOutputDir = path.join(SETTINGS.PROJECT_DIR, `.tmp/output`)

    try {
      new videoModel({...req.file, isStreamable: false}).save(function (err, data) {
        let tmpID = data.id;
        
        if (err) {
          throw new Error(err.message);
        };
        
        // save object to minio
        let stream = fs.createReadStream(tmpSource)
        minioClient.putObject(
          process.env.MINIO_VIDEO_BUCKET_NAME,
          req.file.filename,
          stream,
          async (e) => {
            if (e) {
              await videoModel.remove({_id: tmpID})
              fs.unlinkSync(tmpSource);
              res.status(500).send(e);
            } else {
              // delete temporary file
              fs.unlinkSync(tmpSource);

              // update document
              await videoModel.updateOne({_id: tmpID}, {isStreamable: true});

              res.status(201).send("OK");
            };
          }
        )
      });
      
    } catch (error) {
      fs.unlinkSync(tmp);
      res.status(500).send(error.message);
    }
  }
)

// transcoder(
//   path.join(SETTINGS.PUBLIC_DIR, "giorgio.mp4"),
//   path.join(SETTINGS.PROJECT_DIR, ".tmp"),
//   "mp4"
// )

// Minio Object Storage Buffer
// router.post(
//   "/",
//   upload.single('video'),
//   function(req, res, next) {
    
//     try {
//       minioClient.putObject(
//         process.env.MINIO_VIDEO_BUCKET_NAME,
//         `${req.file.originalname}-${Date.now()}`,
//         req.file.buffer,
//         (e) => {
//           throw new Error(e);
//         }
//       )

//       res.send("OK")
//     } catch (error) {
//       res.status(500).send(error.message);
//     }
//   }
// )

module.exports = router;