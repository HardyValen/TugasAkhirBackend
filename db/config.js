require("dotenv").config();

var mongoose  = require("mongoose");

var db = mongoose.connection;
mongoose.connect(process.env.DB_URL_COMPLETE);

module.exports = {
  dbconnect: function(){
    db.on('error', console.error.bind( console, 'DB Connection Error.'));
    db.once('open', function callback(){
      console.log(`Successfully connected to DB ${db.name}`);
    });
  }
};