const {createFFmpeg, fetchFile} = require("@ffmpeg/ffmpeg");
const path = require("path");
const fs = require("fs");
const commonLogger = require("../logfiles/commonLogger");
const ffmpegErrors = require("./ffmpeg-errors");

async function transcodeVideoDash(inputFileName, inputPath, outputDir, inputExt, cb) {
  let isSuccess = true;

  const ffmpeg = createFFmpeg({
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
      }
    }
  });

  commonLogger.info(`
    [FFMPEG] Filename : ${inputFileName}
    [FFMPEG] InputPath : ${inputPath}
    [FFMPEG] Extension : ${inputExt}
    [FFMPEG] Output : ${outputDir}
  `, {context: "ffmpeg"})

  try {
    // (async () => {
      const tmpDir = inputFileName;
      const tmpName = `${tmpDir}${inputExt}`;
      const tmpOut = `${tmpDir}.mpd`;

      ffmpeg.setProgress(({ratio}) => {
        commonLogger.info(`Progress: ${(ratio*100).toFixed(2)}%`, {context: "ffmpeg"})
      });

      fs.mkdirSync(outputDir, {recursive: true});
      fs.chmodSync(outputDir, 0777);

      if (!ffmpeg.isLoaded()) {
        await ffmpeg.load();
      }
      
      // Create output dir
      ffmpeg.FS("mkdir", `${tmpDir}`);
      ffmpeg.FS('writeFile', `/tmp/${tmpName}`, await fetchFile(inputPath));      
      
      // Run ffmpeg command
      await ffmpeg.run(
        "-i", `/tmp/${tmpName}`,
        "-map", "0", "-map", "0",
        "-c:a", "aac", "-c:v", "libx264",
        "-b:v:0", "800k", "-b:v:1", "300k",
        // "-s:v:1", "240x160", 
        // "-filter:v:1", "iw/2:ih/2", 
        "-profile:v:1", "baseline", "-profile:v:0", "main", "-bf", "1",
        "-keyint_min", "120", "-g", "120", "-sc_threshold", "0", "-b_strategy", "0",
        "-ar:a:1", "22050", "-use_timeline", "1", "-use_template", "1",
        // "-window_size", "5",
        "-adaptation_sets", "id=0,streams=v id=1,streams=a",
        "-init_seg_name", `${tmpDir}-init-stream\$RepresentationID\$.\$ext\$`,
        "-media_seg_name", `${tmpDir}-chunk-stream\$RepresentationID\$-\$Number%05d\$.\$ext\$`,
        "-f", "dash", `${tmpDir}/${tmpOut}`
      ).catch(e => {
        commonLogger.error(`${e.message}`, {context: "ffmpeg"});
      });

      // Recursively write files
      await ffmpeg.FS("readdir", `${tmpDir}`)
        .filter((p) => {
          let strArr = p.split(".");
          return /mpd|m4s/.test(strArr[strArr.length - 1]);
        })
        .forEach(async (f) => {
          await fs.promises.writeFile(
            path.join(`${outputDir}`, f),              // File on disk 
            ffmpeg.FS('readFile', `${tmpDir}/${f}`)    // File on memory
          );
        })
      
      
      // MEMFS Removal
      // Remove all output files inside tmpDir
      await ffmpeg.FS("readdir", `${tmpDir}`)
        .filter((e) => !(/^.$|^..$/.test(e)))
        .forEach(async (data) => {
        ffmpeg.FS("unlink", `${tmpDir}/${data}`);
      })

      // Remove output directory
      ffmpeg.FS("rmdir", `${tmpDir}`);

      // Remove input file from tmp directory  
      ffmpeg.FS("unlink", `/tmp/${tmpName}`);
      commonLogger.info("[FFMPEG-INFO] Transcoding completed", {context: "ffmpeg"});

      if (isSuccess == false) {
        throw new Error("Conversion Failed!");
      };

      await cb(null);
    // })();
  } catch (error) {
    cb(error);
  }
}

module.exports = transcodeVideoDash;