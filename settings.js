var path      = require("path");

module.exports = {
  PROJECT_DIR             : __dirname,
  PUBLIC_DIR              : path.join(__dirname, "public"),
  ACCEPTED_VIDEO_FORMATS  : /mov|mpeg|mp4|avi|wmv|flv|webm|qt/
}