require("dotenv").config();

const Minio = require("minio");

const minioClient =  new Minio.Client({
  endPoint  : process.env.MINIO_URL,
  port      : parseInt(process.env.MINIO_PORT),
  useSSL    : eval(process.env.MINIO_USE_SSL),
  accessKey : process.env.MINIO_ACCESS_KEY,
  secretKey : process.env.MINIO_SECRET_KEY
})

minioClient.listBuckets()
  .then((data) => {
    console.log(`[MINIO-INFO] Connected to Minio, Buckets: ${JSON.stringify(data)}`)
  })
  .catch((error) => {
    console.log(`[MINIO-ERROR] Failed to connect to minio service. \n 
      Error message: ${error.message} `)
  });

module.exports = minioClient;