var express       = require('express'),
    path          = require('path'),
    cookieParser  = require('cookie-parser'),
    logger        = require('morgan'),
    bodyParser    = require("body-parser"),
    cors          = require("cors"),
    db            = require("./db/config"),
    SETTINGS      = require("./settings"),
    transcoder    = require("./encoder/ffmpeg-wasm")
    fs            = require("fs");

global.SETTINGS = SETTINGS

db.dbconnect();

var uploadRouter  = require("./routes/upload");

var app = express();

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false}));
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

app.use('/upload', uploadRouter);

// transcoder(
//   path.join(SETTINGS.PUBLIC_DIR, "giorgio.mp4"),
//   path.join(SETTINGS.PROJECT_DIR, ".tmp"),
//   "mp4"
// )
  
  // let x = path.join(SETTINGS.PUBLIC_DIR, "videos/dash");
// console.log(path.join(x, "test.mpd"));

module.exports = app;
