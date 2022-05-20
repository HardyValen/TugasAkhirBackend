require("dotenv").config();

const express       = require("express");
const path          = require("path");
const multer        = require("multer");
const {v4: uuidv4}  = require("uuid");
const mime          = require("mime-types");
const {videoModel}  = require("../db/schema/video");
const minioClient   = require("../minio-client/config");
const fs            = require("fs");
const morgan = require("morgan");
const transcodeVideoDash = require("../encoder/ffmpeg-wasm");

var router    = express.Router();

// Disk Storage
var storage   = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(SETTINGS.PROJECT_DIR, ".tmp/source"))
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
    .catch((error) => {
      res.status(500).send(JSON.stringify(error.message))
    });
})

router.get("/", function(req, res, next) {
  res.sendFile(path.join(SETTINGS.PUBLIC_DIR, "upload-video.html"));
});

function uploadFile(req, res, next) {
  const uploadTemp = upload.single('video');
  uploadTemp(req, res, function(err) {
    if (err instanceof multer.MulterError) {
      console.error("[MULTER-ERROR] A Multer error occured when uploading");
      res.status(500).send("A Multer error occured when uploading");
    } else if (err) {
      console.error("[ERROR] An unknown error occured when uploading");
      res.status(500).send("An unknown error occured when uploading");
    }

    next();
  })
}

// Disk Storage
router.post(
  "/",  
  uploadFile,
  async function(req, res) {
    // If no multer error
    res.status(201).send("OK");

    let tmpName = req.file.filename.split(".")[0];
    let tmpSource = path.join(SETTINGS.PROJECT_DIR, `.tmp/source/${req.file.filename}`);
    let tmpOutputDir = path.join(SETTINGS.PROJECT_DIR, `.tmp/output/${tmpName}`)
    let tmpDocID;

    let a = await new videoModel({...req.file, filename: tmpName, isStreamable: false, isFailed: false, errorMessage: ""})
    a.save(async function (error, data) {
      tmpDocID = data.id;

      // transcode object
      try {
        if (error) {
          throw error;
        };

        tmpDocID = data.id;

        // make output temp path
        fs.mkdirSync(tmpOutputDir);
        fs.chmodSync(tmpOutputDir, 0777);
        
        transcodeVideoDash(
          tmpName,
          tmpSource,
          tmpOutputDir,
          path.extname(req.file.originalname).toLowerCase(),
          async (error) => {
            try {
              if (error) {
                throw error;
              }
              
              // save objects to minio
              // list all files of a directory, excluding . and ..
              let outputFiles = fs.readdirSync(tmpOutputDir).filter(e => !(/^.$|^..$/.test(e)));
              
              for(var i = 0; i < outputFiles.length; i++) {
                let filename = outputFiles[i];
                console.log(`[MINIO-INFO] Uploading ${filename}...`);
                let outputPath = path.join(tmpOutputDir, filename);

                let stream = fs.createReadStream(outputPath);
                minioClient.putObject(
                  process.env.MINIO_VIDEO_BUCKET_NAME,
                  `${tmpName}/${filename}`,
                  stream,
                  async (error) => {
                    if (error) {
                      console.error(`[MINIO-ERROR] Failed when uploading to minio`);
                      await videoModel.updateOne({_id: tmpDocID}, {isStreamable: false});
                    } else {
                      console.log(`[MINIO-INFO] ${filename} successfully uploaded!`);
                    };
                  }
                );
              }

              await videoModel.updateOne({_id: tmpDocID}, {isStreamable: true});
              fs.unlinkSync(tmpSource);
              fs.rmdirSync(tmpOutputDir, {recursive: true});
            } catch (error) {
              // fs.unlinkSync(tmpSource);
              console.error(`[TRANSCODE-ERROR] ${error.message}`)
              await videoModel.updateOne({_id: tmpDocID}, {
                isFailed: true,
                errorMessage: error.message
              });
              fs.unlinkSync(tmpSource);
              fs.rmdirSync(tmpOutputDir, {recursive: true});
            }
            // console.log("[MINIO-INFO] Files uploaded successfully!")
          }
        )
      } catch (error) {
        console.error(`[TRANSCODE-ERROR] ${error.message}`)
        await videoModel.updateOne({_id: tmpDocID}, {
          isFailed: true,
          errorMessage: error.message
        });
        fs.unlinkSync(tmpSource);
        fs.rmdirSync(tmpOutputDir, {recursive: true});
      }
      // end of transcode
    });
  }
);

module.exports = router;