const mongoose    = require("mongoose");

const analyticsSchema = new mongoose.Schema({
  "data"              : "mixed",
  "createdAt"         : "number",
  "updatedAt"         : "number"
})

const analyticsModel  = mongoose.model("dev-analytics", analyticsSchema)
// const analyticsModel  = mongoose.model("video", analyticsSchema)

module.exports = {
  analyticsSchema, 
  analyticsModel
};