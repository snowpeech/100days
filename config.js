/** Shared config for application; can be req'd many places. */

require("dotenv").config();

const SECRET = process.env.SECRET_KEY || 'londonfog123';

const PORT = +process.env.PORT || 3001;

const BCRYPT_WORK_FACTOR = 12;

// let DB_URI;

// if (process.env.NODE_ENV === "test") {
//   DB_URI = "hundreddays_test";
// } else {
//   DB_URI  = process.env.DATABASE_URL || 'hundreddays';
// }

// Use dev database, testing database, or via env var, production database
function getDatabaseUri() {
  return (process.env.NODE_ENV === "test")
      ? "hundreddays_test"
      : process.env.DATABASE_URL || "hundreddays";
}

module.exports = {
  SECRET,
  PORT,
  BCRYPT_WORK_FACTOR,
  getDatabaseUri,
};
