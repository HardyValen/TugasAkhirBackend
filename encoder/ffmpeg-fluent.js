// const ffmpeg = require('fluent-ffmpeg');
// const path = require("path");
// const fs = require("fs");

// function transcoder(inputPath, inputName) {
//   outputDir = path.join(SETTINGS.PROJECT_DIR, `.tmp/${inputName}-${Date.now()}`);

//   fs.mkdirSync(outputDir, {recursive: true});

//   ffmpeg(inputPath).inputOptions([
//     "-re",
//     "-map", "0",
//     "-map", "0",
//     "-c:a", "aac",
//     "-c:v", "libx264",
//     "-b:v:0", "800k",
//     "-b:v:1", "300k",
//     "-profile:v:1", "baseline",
//     "-profile:v:0", "main",
//     "-bf", "1",
//     "-keyint_min", "120",
//     "-g", "120",
//     "-sc_threshold", "0",
//     "-b_strategy", "0",
//     "-ar:a:1", "22050",
//     "-use_timeline", "1",
//     "-use_template", "1",
//     "-window_size", "5",
//     "-adaptation_sets", `&#34;id=0,streams=v&#32;id=1,streams=a&#34;`,
//     "-f", "mp4"
//   ])
//     .withSize("?x480")
//     .output(path.join(outputDir, `${inputName}.mpd`))
//     .on("error", function(e) {
//       console.log(`[ERROR] ${e}`)
//       fs.rmdirSync(outputDir, {recursive: true, force: true})
//     })
//     .on("end", () => {
//       console.log("Finished processing")
//     })
//     .run();
// }

// module.exports = transcoder;