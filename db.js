const { Client } = require("pg");

let DB_URI;

if (process.env.NODE_ENV === "test") {
  DB_URI = "postgresql:///hundreddays_test";
} else {
  DB_URI = process.env.DATABASE_URL || "postgresql:///hundreddays";
  // DB_URI = "postgresql:///hundreddays";
}

let db = new Client({
  connectionString: DB_URI
});

db.connect();

module.exports = db;