require("dotenv").config();

const logger        = require("./logfiles/HTTPLogger");
const express       = require('express');
const cookieParser  = require('cookie-parser');
const bodyParser    = require("body-parser");
const cors          = require("cors");
const db            = require("./db/config");

db.dbconnect();

const app           = express();

app.use(logger(process.env.ENV));

var uploadRouter  = require("./routes/upload");
var vodRouter     = require("./routes/vod");
var debugRouter   = require("./routes/debug");
var logRouter     = require("./routes/log");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false}));
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

app.use('/debug', debugRouter);
app.use('/upload', uploadRouter);
app.use('/vod', vodRouter);
app.use("/log", logRouter);

// Clean .tmp if database has been connected, check ./db/config file for more info
module.exports = app;
