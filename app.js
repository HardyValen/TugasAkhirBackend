require("dotenv").config();

const logger        = require("./logfiles/HTTPLogger");
const express       = require('express');
const cookieParser  = require('cookie-parser');
const bodyParser    = require("body-parser");
const cors          = require("cors");
const db            = require("./db/config");

db.dbconnect();

const app           = express();

if (process.env.ENV === "production") {
  app.use(logger(process.env.ENV));
}
app.use(logger("dev"));

const uploadRouter    = require("./routes/upload");
const vodRouter       = require("./routes/vod");
const debugRouter     = require("./routes/debug");
const logRouter       = require("./routes/log");
const analyticsRouter = require("./routes/analytics");

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
app.use("/analytics", analyticsRouter);

// Clean .tmp if database has been connected, check ./db/config file for more info
module.exports = app;
