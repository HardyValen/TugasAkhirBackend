var express       = require('express'),
    path          = require('path'),
    cookieParser  = require('cookie-parser'),
    logger        = require('morgan'),
    bodyParser    = require("body-parser"),
    cors          = require("cors"),
    db            = require("./db/config"),
    SETTINGS      = require("./settings"),
    fs            = require("fs");
const { getMimeType } = require('stream-mime-type');

global.SETTINGS = SETTINGS

db.dbconnect();

var uploadRouter  = require("./routes/upload");
var vodRouter     = require("./routes/vod");

var app = express();

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false}));
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

app.use('/upload', uploadRouter);
app.use('/vod', vodRouter);

// let b = fs.readFileSync(path.join(PUBLIC_DIR, "giorgio.mpd"));
// (async () => {
//   const { mime } = await getMimeType(b);
//   console.log(mime);
// })()

module.exports = app;
