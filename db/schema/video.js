const mongoose    = require("mongoose");

const videoSchema = new mongoose.Schema({
  "originalname"  : "string",
  "encoding"      : "string",
  "mimetype"      : "string",
  "path"          : "string",
  "filename"      : "string",
  "size"          : "number"
})

const videoModel  = mongoose.model("video", videoSchema)

module.exports = {
  videoSchema, 
  videoModel
};