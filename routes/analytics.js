require("dotenv").config();

const express = require("express");
const { analyticsModel } = require("../db/schema/videoAnalytics");
const commonLogger = require("../logfiles/commonLogger");
const router = express.Router();

router.post(
  "/",
  async function(req, res) {
    let analytics = await new analyticsModel({
      data: req.body.analytics,
      createdAt: Date.now(),
      updatedAt: Date.now()
    })
    analytics.save(async function(error, data) {
      if (error) {
        commonLogger.error(`Failed when handling analytics request, Error: ${error.message}`, {context: "mongo"})
        res.status(500).send(error.message);
      } else {
        commonLogger.info(`Analytics accepted with ID: ${data.id}`, {context: "mongo"})
        res.status(200).send(`Analytics accepted with ID: ${data.id}`)
      }
    })
  }
)

module.exports = router;