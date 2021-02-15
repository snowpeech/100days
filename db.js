"use strict";

const { Pool } = require("pg");
const {getDatabaseUri} = require("./config");

// let DB_URI;
console.log("I'm in db.js");
// if (process.env.NODE_ENV === "test") {
//   DB_URI = "postgresql:///hundreddays_test";
// } else {
//   DB_URI = process.env.DATABASE_URL || "postgresql:///hundreddays";
//   console.log("DB_URI::", DB_URI)
//   // DB_URI = "postgresql:///hundreddays";
// }

const db = new Pool({
  connectionString: getDatabaseUri()
});

db.connect();

module.exports = db;