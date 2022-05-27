require("dotenv").config();

const express       = require("express");
const path          = require("path");
const multer        = require("multer");
const {videoModel}  = require("../db/schema/video");
const minioClient   = require("../minio-client/config");
const fs            = require("fs");
const transcode     = require("../encoder/ffmpeg-wasm");
const crypto        = require("crypto");
const { getMimeType } = require("stream-mime-type");

var router    = express.Router();

// Disk Storage
var storage   = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(SETTINGS.PROJECT_DIR, ".tmp/source"))
  },
  filename: function(req, file, cb) {
    let extension = path.extname(file.originalname);
    let name = crypto.createHash('sha1').update(`${file.originalname}-${Date.now()}`).digest("hex").toString();
    console.log(`[UPLOAD-INFO] new filename = ${name}${extension}`);
    cb(null, `${name}${extension}`)
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
  const mimetypes = SETTINGS.ACCEPTED_VIDEO_MIMES;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = mimetypes.test(file.mimetype);

  if(mimetype && extname){
    return cb(null,true);
  } else {
    cb('[UPLOAD-ERROR] Error: Videos Only!');
  }
}

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

router.get("/", function(req, res, next) {
  res.sendFile(path.join(SETTINGS.PUBLIC_DIR, "upload-video.html"));
});


// Disk Storage
router.post(
  "/",  
  uploadFile,
  function (req, res, next) {
    if (!req.file) {
      res.status(500).send("No file sent to server")
    } else {
      next();
    }
  },
  async function(req, res) {
    // If no multer error
    
    res.status(201).send("OK");

    let fieldname = req.body.fieldname;
    let tmpName = req.file.filename.split(".")[0];
    let tmpSource = path.join(SETTINGS.PROJECT_DIR, `.tmp/source/${req.file.filename}`);
    let tmpOutputDir = path.join(SETTINGS.PROJECT_DIR, `.tmp/output/${tmpName}`)
    let tmpDocID;

    let a = await new videoModel({
      fieldname: fieldname,
      objectname: tmpName,
      originalname: req.file.originalname,
      size: req.file.size,
      isStreamable: false,
      isFailed: false,
      errorMessage: ""
    })
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
        
        await transcode(
          tmpName,
          tmpSource,
          tmpOutputDir,
          path.extname(req.file.originalname).toLowerCase(),
          async (error) => {
            try {
              try {
                fs.unlink(tmpSource, () => {
                  console.warn("[DELETE-WARNING] SOURCE DELETED ...")
                });
              } catch (error) {}

              if (error) {
                throw error;
              }
              
              // save objects to minio
              // list all files of a directory, excluding . and ..
              let outputFiles = fs.readdirSync(tmpOutputDir).filter(e => !(/^.$|^..$/.test(e)));
              
              // I think i'll use recursion
              async function recursiveUpload(files, outputDir, error) {
                if (files.length > 0 && Array.isArray(files)) {
                  let tmp = files;
                  let filename = tmp.pop();

                  let outputPath  = path.join(outputDir, filename);

                  let extension = filename.split(".");
                  extension = extension[extension.length - 1];

                  console.log(`[MINIO-INFO] Uploading ${filename}`);

                  try {
                    let stream = fs.createReadStream(outputPath);

                    minioClient.putObject(
                      process.env.MINIO_VIDEO_BUCKET_NAME,
                      `${tmpName}/${filename}`,
                      stream,
                      async (error) => {
                        if (error) {
                          console.error(`[MINIO-ERROR] Failed when uploading to minio, Error: ${error.message}`);
                          await videoModel.updateOne({_id: tmpDocID}, {isStreamable: false, isFailed: true, errorMessage: error.message});
                          recursiveUpload([], outputDir, error);
                        } else {
                          console.log(`[MINIO-INFO] ${filename} successfully uploaded!`);
                          recursiveUpload(tmp, outputDir, null);
                        }
                      }
                    );

                    // Somebody help me on fPutObject please
                    // minioClient.fPutObject(
                    //   process.env.MINIO_VIDEO_BUCKET_NAME,
                    //   `${tmpName}/${filename}`,
                    //   outputPath,
                    //   { 'Content-Type': 'application/octet-stream' },
                    //   async (error) => {
                    //     if (error) {
                    //       console.error(`[MINIO-ERROR] Failed when uploading to minio, Error: ${error.message}`);
                    //       await videoModel.updateOne({_id: tmpDocID}, {isStreamable: false});
                    //       recursiveUpload([], outputDir, error);
                    //     } else {
                    //       console.log(`[MINIO-INFO] ${filename} successfully uploaded!`);
                    //       recursiveUpload(tmp, outputDir, null);
                    //     }
                    //   }
                    // );
                  } catch (error) {
                    console.error(error.message);
                  }
                } else if (files.length == 0 && Array.isArray(files)) {
                  try {
                    fs.rmdirSync(outputDir, { recursive: true })
                    console.warn("[DELETE-WARNING] OUTPUT DELETED ...")
                    
                    if (!error) {
                      await videoModel.updateOne({_id: tmpDocID}, {isStreamable: true});
                    }
                  } catch (e) {
                    console.error(e)
                  }
                }
              }

              await recursiveUpload(outputFiles, tmpOutputDir, null);
              
            } catch (error) {
              // fs.unlinkSync(tmpSource);
              console.error(`[TRANSCODE-ERROR] ${error.message}`)
              await videoModel.updateOne({_id: tmpDocID}, {
                isStreamable: false,
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