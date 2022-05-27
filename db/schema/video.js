const mongoose    = require("mongoose");

const videoSchema = new mongoose.Schema({
  "fieldname"     : "string",
  "objectname"    : "string",
  "originalname"  : "string",
  "size"          : "number",
  "isStreamable"  : "boolean",
  "isFailed"      : "boolean",
  "errorMessage"  : "string",
})

const videoModel  = mongoose.model("video", videoSchema)

module.exports = {
  videoSchema, 
  videoModel
};