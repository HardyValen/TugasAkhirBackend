var path      = require("path");

module.exports = {
  PROJECT_DIR             : __dirname,
  PUBLIC_DIR              : path.join(__dirname, "public"),
  ACCEPTED_VIDEO_FORMATS  : /mov|mp4|mpeg|avi|wmv|flv|webm/,
  ACCEPTED_VIDEO_MIMES    : /video\/quicktime|video\/mp4|video\/mpeg|video\/x-msvideo|video\/x-ms-wmv|video\/x-flv|video\/webm|/
}