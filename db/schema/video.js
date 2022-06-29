const mongoose    = require("mongoose");

const videoSchema = new mongoose.Schema({
  "videoStatus"       : {
    "code": "number",
    "message": "string"
  },
  "fieldname"         : "string",
  "objectname"        : "string",
  "originalname"      : "string",
  "videoDescription"  : "string",
  "size"              : "number",
})

const videoModel  = mongoose.model("dev-video", videoSchema)

module.exports = {
  videoSchema, 
  videoModel
};