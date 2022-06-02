require("dotenv").config();

const express = require("express");
const minioClient = require("../minio-client/config");
const router = express.Router();
const { status } = require("../db/config");

router.get("/storage", (req, res) => {
  minioClient.listBuckets()
  .then((data) => {
    res.status(200).send(`Connected to Minio, Buckets: ${JSON.stringify(data)}`)
  })
  .catch((error) => {
    res.status(200).send(`Failed to connect to minio service. Error message: ${error.message}`)
  });
})

router.get("/db", (req, res) => {
  res.status(200).send(`Database name: ${status.name}, State: ${status.readyState}`)
})


module.exports = router;