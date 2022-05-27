require("dotenv").config();

var mongoose  = require("mongoose");

var db = mongoose.connection;
mongoose.connect(process.env.DB_URL_COMPLETE);

module.exports = {
  dbconnect: function(){
    db.on('error', console.error.bind( console, '[MONGO-ERROR] DB Connection Error.'));
    db.once('open', function callback(){
      console.log(`[MONGO-INFO] Successfully connected to DB ${db.name}`);
    });
  }
};