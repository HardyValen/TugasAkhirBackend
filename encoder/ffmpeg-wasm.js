const {createFFmpeg, fetchFile} = require("@ffmpeg/ffmpeg");
const path = require("path");
// const settings = require("../settings");
const fs = require("fs");
// const {v4: uuidv4} = require("uuid");

function transcodeVideoDash(inputFileName, inputPath, outputDir, inputExt, cb) {
  const ffmpeg = createFFmpeg({
    log: true
  });

  console.log(`
    [FFMPEG-INFO] Filename : ${inputFileName}\n
    [FFMPEG-INFO] InputPath : ${inputPath}\n
    [FFMPEG-INFO] Extension : ${inputExt}\n
    [FFMPEG-INFO] Output : ${outputDir}
  `)

  try {
    (async () => {
      const tmpDir = inputFileName;
      const tmpName = `${tmpDir}.${inputExt}`;
      const tmpOut = `${tmpDir}.mpd`;

      await ffmpeg.setProgress(({ratio}) => {
        console.log(`[FFMPEG-INFO] Progress: ${(ratio*100).toFixed(2)}%`)
      });

      fs.mkdirSync(outputDir, {recursive: true});
      fs.chmodSync(outputDir, 0777);

      if (!ffmpeg.isLoaded()) {
        await ffmpeg.load();
      }
      
      // Create output dir
      await ffmpeg.FS("mkdir", `${tmpDir}`);
      ffmpeg.FS('writeFile', `/tmp/${tmpName}`, await fetchFile(inputPath));      
      
      // Run ffmpeg command
      await ffmpeg.run(
        "-re", "-i", `/tmp/${tmpName}`,
        "-map", "0", "-map", "0",
        "-c:a", "aac", "-c:v", "libx264",
        "-b:v:0", "800k", "-b:v:1", "300k", "-s:v:1", "240x160", 
        "-profile:v:1", "baseline", "-profile:v:0", "main", "-bf", "1",
        "-keyint_min", "120", "-g", "120", "-sc_threshold", "0", "-b_strategy", "0",
        "-ar:a:1", "22050", "-use_timeline", "1", "-use_template", "1",
        "-window_size", "5",
        "-adaptation_sets", "id=0,streams=v id=1,streams=a",
        "-f", "dash", `${tmpDir}/${tmpOut}`
      );

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
        await ffmpeg.FS("unlink", `${tmpDir}/${data}`);
      })

      // Remove output directory
      await ffmpeg.FS("rmdir", `${tmpDir}`);

      // Remove input file from tmp directory  
      await ffmpeg.FS("unlink", `/tmp/${tmpName}`);
      console.log("[FFMPEG-INFO] Transcoding completed");
      await cb(null);
    })();
  } catch (error) {
    cb(error);
  }
}

module.exports = transcodeVideoDash;