const fs = require("fs");
const path = require("path");
const SETTINGS = require("../settings");

fs.rmdirSync(path.join(SETTINGS.PROJECT_DIR, ".tmp"), {recursive: true});
fs.mkdirSync(path.join(SETTINGS.PROJECT_DIR, ".tmp"), {recursive: true});
fs.mkdirSync(path.join(SETTINGS.PROJECT_DIR, ".tmp/output"), {recursive: true});
fs.mkdirSync(path.join(SETTINGS.PROJECT_DIR, ".tmp/source"), {recursive: true});
fs.chmodSync(path.join(SETTINGS.PROJECT_DIR, ".tmp"), 0777);
fs.chmodSync(path.join(SETTINGS.PROJECT_DIR, ".tmp/output"), 0777);
fs.chmodSync(path.join(SETTINGS.PROJECT_DIR, ".tmp/source"), 0777);
