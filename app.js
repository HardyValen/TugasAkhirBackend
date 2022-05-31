require("dotenv").config();

const express       = require('express');
const path          = require('path');
const cookieParser  = require('cookie-parser');
const bodyParser    = require("body-parser");
const cors          = require("cors");
const logger        = require("./logfiles/HTTPLogger");
const db            = require("./db/config");
const SETTINGS      = require("./settings");
const fs            = require("fs");

const app           = express();

app.use(logger(process.env.ENV));

var uploadRouter  = require("./routes/upload");
var vodRouter     = require("./routes/vod");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false}));
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

app.use('/upload', uploadRouter);
app.use('/vod', vodRouter);

module.exports = app;
