var express       = require("express"),
    path          = require("path"),
    multer        = require("multer"),
    {v4: uuidv4}  = require("uuid"),
    mime          = require("mime-types"),
    {videoModel}  = require("../db/schema/video"),
    minioClient   = require("../minio-client/config");

var router    = express.Router();
var storage   = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(SETTINGS.PUBLIC_DIR, "videos/source/"))
  },
  filename: function(req, file, cb) {
    let extension = mime.extension(file.mimetype);
    cb(null, `${uuidv4()}-${Date.now()}.${extension}`)
  }
})



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

router.post(
  "/",  
  upload.single('video'),
  function(req, res, next) {
    try {
      new videoModel({...req.file, isStreamable: false}).save(function (err) {
        if (err) throw new Error(err.message);
      });
      res.status(201).send("OK");

      
    } catch (error) {
      res.status(500).send(error.message);
    }
  }
)

module.exports = router;