const path      = require("path");

const SETTINGS = {
  PROJECT_DIR             : __dirname,
  PUBLIC_DIR              : path.join(__dirname, "public"),
  HTTP_LOG_DIR            : path.join(__dirname, "logfiles/HTTP"),
  COMMON_LOG_DIR          : path.join(__dirname, "logfiles/common"),
  ACCEPTED_VIDEO_FORMATS  : /mov|mp4|mpeg|avi|wmv|flv|webm/,
  ACCEPTED_VIDEO_MIMES    : /video\/quicktime|video\/mp4|video\/mpeg|video\/x-msvideo|video\/x-ms-wmv|video\/x-flv|video\/webm|/
}

module.exports = SETTINGS