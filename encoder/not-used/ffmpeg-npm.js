// const ffmpeg = require("ffmpeg");
// const path = require("path");

// function transcodeVideo(inputPath) {
//   try {
//     let process = new ffmpeg(inputPath);

//     process.then(function (video) {
//       video.addCommand("-map", "0")
//       video.addCommand("-map", "1")
//       video.addCommand("-c:a", "aac")
//       video.addCommand("-c:v", "libx264")
//       video.addCommand("-b:v:0", "800k")
//       video.addCommand("-b:v:1", "300k")
//       video.setVideoSize("?x480", true, true)
//       video.addCommand("-profile:v:0", "main")
//       video.addCommand("-profile:v:1", "baseline")
//       video.addCommand("-bf", "1")
//       video.addCommand("-keyint_min", "120")
//       video.addCommand("-g", "120")
//       video.addCommand("-sc_threshold", "0")
//       video.addCommand("-b_strategy", "0")
//       video.addCommand("-ar:a:1", "22050")
//       video.addCommand("-use_timeline", "1")
//       video.addCommand("-use_template", "1")
//       video.addCommand("-window_size", "5")
//       video.addCommand("-adaptation_sets", '"id=0,streams=v id=1,streams=a"')
//       video.addCommand("-f", "dash")
//       video.save(
//           path.join(SETTINGS.PUBLIC_DIR, `/videos/test.mpd`),
//           function (error, file) {
//             if (!error, file) {
//               console.log("Video file: " + file);
//             } else {
//               console.log(error)
//             }
//           }
//         );

//       // video.addCommand("-f", "avi");
//       // video.save(
//       //   path.join(SETTINGS.PUBLIC_DIR, `/videos/test.avi`),
//       //   function (error, file) {
//       //     if (!error, file) {
//       //       console.log("Video file: " + file);
//       //     } else {
//       //       console.log(error)
//       //     }
//       //   }
//       // );

//     }, function(e) {
//       console.log("Error");  
//     })
//   } catch (e) {
//     console.log(`[FFMPEG ERROR ${e.code}] ${e.msg}`);
//   }
// }

// module.exports = transcodeVideo