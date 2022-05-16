require("dotenv").config();

const express       = require("express");
const path          = require("path");
const multer        = require("multer");
const {v4: uuidv4}  = require("uuid");
const mime          = require("mime-types");
const {videoModel}  = require("../db/schema/video");
const minioClient   = require("../minio-client/config");
const fs            = require("fs");
const { createFFmpeg, fetchFile } = require("@ffmpeg/ffmpeg");
const morgan = require("morgan");

var router    = express.Router();

// Disk Storage
var storage   = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(SETTINGS.PUBLIC_DIR, "videos/source/"))
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
    let tmp = path.join(SETTINGS.PUBLIC_DIR, `videos/source/${req.file.filename}`);

    try {
      new videoModel({...req.file, isStreamable: false}).save(function (err, data) {
        let tmpID = data.id;
        
        if (err) {
          throw new Error(err.message);
        };
        
        // save object to minio
        let stream = fs.createReadStream(tmp)
        minioClient.putObject(
          process.env.MINIO_VIDEO_BUCKET_NAME,
          req.file.filename,
          stream,
          async (e) => {
            if (e) {
              await videoModel.remove({_id: tmpID})
              fs.unlinkSync(tmp);
              res.status(500).send(e);
            } else {
              // delete temporary file
              fs.unlinkSync(tmp);

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

function transcodeVideo(filename, filepath, outputPath) {
  const ffmpeg = createFFmpeg({
    log: true,
    logger: morgan("combined")
  });

  (async () => {
    await ffmpeg.load();
    ffmpeg.FS('writeFile', filename, await fetchFile(filepath));
    await ffmpeg.run(
      "-re", "-i", "$2", "-map", "0", "-map", "0", "-c:a", "aac", "-c:v", "libx264",
      "-b:v:0", "800k", "-b:v:1", "300k", "-s:v:1", "320x170", "-profile:v:1", "baseline",
      "-profile:v:0", "main", "-bf", "1", "-keyint_min", "120", "-g", "120", "-sc_threshold", "0",
      "-b_strategy", "0", "-ar:a:1", "22050", "-use_timeline", "1", "-use_template", "1",
      "-window_size", "5", "-adaptation_sets", "'id=0,streams=v id=1,streams=a'",
      "-f", "dash", `${outputPath}.mpd`
    )
  })();
}

module.exports = router;