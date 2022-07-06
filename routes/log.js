require("dotenv").config();

const express = require("express");
const minioClient = require("../minio-client/config");
const router = express.Router();
const path = require("path");
const SETTINGS = require("../settings");
const commonLogger = require("../logfiles/commonLogger");
const fs = require("fs");

function listObject(server_id, log_severity, search_type, quantity, cb) {
  let data = [];
  let mode = search_type.split("-");

  let listStream = minioClient.listObjects(
    process.env.MINIO_LOG_BUCKET_NAME,
    mode[0] == "http" ? path.join(server_id, mode[0]) : path.join(server_id, mode[0], log_severity),
    true
  )

  listStream.on("data", obj => {
    data.push({basename: path.basename(obj.name), ...obj})
  })

  listStream.on("end", () => {
    if (mode[1] == "desc") {
      data.sort((a, b) => (a.basename < b.basename ? 1 : -1))
    } else {
      data.sort((a, b) => {a.basename > b.basename ? 1 : -1})
    }

    cb(quantity == -1 ? data : data.slice(0, quantity), null);
  });

  listStream.on("error", err => {
    cb(null, err)
  });
}

router.get("/", (req, res) => {
  let server_id = req.query.server_id;
  let log_severity = req.query.log_severity;
  let search_query = req.query.search_query;
  let quantity = parseInt(req.query.quantity);
  let search_type = req.query.search_type;

  // default
  if (!log_severity || (["info", "error"].indexOf(log_severity) == -1)) {
    log_severity = "info"
  }
  
  if (!quantity || isNaN(quantity)) {
    quantity = 10
  }

  if (!search_type || (["http-asc", "http-desc", "common-asc", "common-desc"].indexOf(search_type) == -1)) {
    search_type = "http-desc";
  }

  if (search_query) {
    let outputDir = SETTINGS.PUBLIC_DIR;
    let outputPath = path.join(outputDir, path.basename(search_query))

    minioClient.fGetObject(
      process.env.MINIO_LOG_BUCKET_NAME,
      search_query,
      outputPath,
      async(err) => {
        if (err) {
          commonLogger.error(err, {context: "minio"})
          res.status(404).send("File not found")
        } else {
          res.status(200).sendFile(outputPath, () => {
            if (fs.existsSync(outputPath)) {
              fs.rmSync(outputPath)
            }
          })
        }
      }
    )
  } else {
    // res.status(200).json({
    //   server_id,
    //   log_severity,
    //   search_query,
    //   quantity,
    //   search_type
    // })
    if (!server_id) {
      res.status(404).json({
        message: "Please specify server_id on URL query string"
      })
    } else {
      listObject(
        server_id, 
        log_severity,
        search_type,
        quantity,
        (obj, err) => {
          if (err) {
            res.status(404).json({
              message: "There was an error while processing the request"
            })
          } else {
            res.status(200).send(obj)
          }
        }
      )
    }
  }
})

// router.get("/http", (req, res) => {
//   res.status(200).send("http OK")
// })

module.exports = router;