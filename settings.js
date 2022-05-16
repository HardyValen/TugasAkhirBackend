var path      = require("path");
var mimetypes = require("mime-types");

module.exports = {
  PROJECT_DIR             : __dirname,
  PUBLIC_DIR              : path.join(__dirname, "public"),
  ACCEPTED_VIDEO_FORMATS  : /mov|mpeg|mp4|avi|wmv|flv|webm|qt/
}