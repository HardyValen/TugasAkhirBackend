const { createFFmpeg } = require("@ffmpeg/ffmpeg");
const commonLogger = require("../logfiles/commonLogger");
const ffmpegErrors = require("./ffmpeg-errors");

let ffmpegInstance = createFFmpeg({
  logger: ({message}) => {
    let x = 0;
    commonLogger.info(message, {context: "ffmpeg"});
    ffmpegErrors.forEach(e => {
      if (message.includes(e)) {
        x++
      }
    })
    if (x > 0) {
      isSuccess = false
      commonLogger.error(message, {context: "ffmpeg"});
    }
  }
});

module.exports = ffmpegInstance;