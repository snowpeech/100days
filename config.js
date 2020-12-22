/** Shared config for application; can be req'd many places. */

require("dotenv").config();

const SECRET = process.env.SECRET_KEY || 'londonfog123';

const PORT = +process.env.PORT || 3001;

const BCRYPT_WORK_FACTOR = 12;
// database is:
//
// - on Heroku, get from env var DATABASE_URL
// - in testing, 'jobly-test'
// - else: 'jobly'

let DB_URI;

if (process.env.NODE_ENV === "test") {
  DB_URI = "hundreddays_test";
} else {
  DB_URI  = process.env.DATABASE_URL || 'hundreddays';
}

console.log("Using database", DB_URI);

module.exports = {
  SECRET,
  PORT,
  BCRYPT_WORK_FACTOR,
  DB_URI,
};
