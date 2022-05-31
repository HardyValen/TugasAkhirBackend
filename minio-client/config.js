require("dotenv").config();

const Minio = require("minio");
const commonLogger = require("../logfiles/commonLogger");

const minioClient =  new Minio.Client({
  endPoint  : process.env.MINIO_URL,
  port      : parseInt(process.env.MINIO_PORT),
  useSSL    : eval(process.env.MINIO_USE_SSL),
  accessKey : process.env.MINIO_ACCESS_KEY,
  secretKey : process.env.MINIO_SECRET_KEY
})

minioClient.listBuckets()
  .then((data) => {
    commonLogger.info(`Connected to Minio, Buckets: ${JSON.stringify(data)}`, {context: "minio"})
  })
  .catch((error) => {
    commonLogger.error(`Failed to connect to minio service.\nError message: ${error.message}`, {context: "minio"})
  });

module.exports = minioClient;