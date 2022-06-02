require("dotenv").config();

const logger        = require("./logfiles/HTTPLogger");
const express       = require('express');
const path          = require('path');
const cookieParser  = require('cookie-parser');
const bodyParser    = require("body-parser");
const cors          = require("cors");
const SETTINGS      = require("./settings");
const fs            = require("fs");
const db            = require("./db/config");

db.dbconnect();

const app           = express();

app.use(logger(process.env.ENV));

var uploadRouter  = require("./routes/upload");
var vodRouter     = require("./routes/vod");
var debugRouter   = require("./routes/debug");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false}));
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

app.use('/debug', debugRouter);
app.use('/upload', uploadRouter);
app.use('/vod', vodRouter);

module.exports = app;
