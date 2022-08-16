require("dotenv").config();

const express       = require("express");
const minioClient   = require("../minio-client/config");
const router        = express.Router();
const { status }    = require("../db/config");
const crypto        = require("crypto");
const fs            = require("fs");
const os            = require("os");
const commonLogger = require("../logfiles/commonLogger");

router.get("/storage", (req, res) => {
  minioClient.listBuckets()
  .then((data) => {
    res.status(200).send(`Storages: ${JSON.stringify(data)}`)
  })
  .catch((error) => {
    res.status(200).send(`Failed to connect to minio service. Error message: ${error.message}`)
  });
})

router.get("/db", (req, res) => {
  res.status(200).send(`Database name: ${status.name}, State: ${status.readyState}`)
})

router.get("/spec", (req, res) => {
  res.status(200).json(process.env.SERVER_ID);
})

// router.get("/random", (req, res) => {
//   let x = crypto.createHash('sha1').update(`${Date.now()}-${Math.random()}`).digest("hex").toString();
//   fs.appendFileSync("./logfiles/test.txt", `"${x}",${os.EOL}` , "utf8");
//   res.status(200).send(x)
// })

// router.get("/testArray", (req, res) => {
//   let x = fs.readFileSync("./logfiles/test.txt").toString()
//   x = JSON.parse(x);
//   x = [...new Set(x)]
//   console.log(x.length)
//   res.status(200).send("OK")
// })

module.exports = router;