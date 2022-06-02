require("dotenv").config();
const fs = require("fs");
const minioClient = require("../minio-client/config");


function refreshLog(logPath, bucketLocation, cb) {
  try {
    if (fs.existsSync(logPath)) {
      if (fs.readFileSync(logPath).length != 0) {
        let stream = fs.createReadStream(logPath)
        minioClient.putObject(
          process.env.MINIO_LOG_BUCKET_NAME,
          bucketLocation,
          stream,
          (error) => {
            fs.truncateSync(logPath);
            stream.close();

            if (error) {
              cb(error.message);
            }
          }
        )
      }
    }
  } catch (error) {
    cb(error.message)
  }
}

module.exports = refreshLog;