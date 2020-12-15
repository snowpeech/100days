const express = require("express");
const app = express();
const cors = require("cors");
const { PORT } = require("./config")

const ExpressError = require("./helpers/expressError");

app.use(express.json()); // Parse request bodies for JSON
app.use(cors());

// const uRoutes = require("./routes/users");

// app.use("/users", uRoutes);

/** 404 error handler **/
app.use(function (req,res, next) {
    const err = new ExpressError("Not Found", 404);
    return next(err)
});

/** general error handler **/
app.use(function (err, req, res, next){
    let status = err.status || 500;

    return res.status(status).json({
        error: {
            message: err.message,
            status: status
        }
    });
});

app.listen(PORT, function () {
    console.log(`Server starting on port ${PORT}!`);
  });
  