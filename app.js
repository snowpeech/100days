const express = require("express");
const app = express();
const cors = require("cors");
const morgan = require('morgan');

const ExpressError = require("./helpers/expressError");
const userRoutes = require("./routes/users");

app.use(express.json()); // Parse request bodies for JSON
app.use(cors());
app.use(morgan("tiny"));

/* routes */
app.use("/users", userRoutes);

/** 404 error handler **/
app.use(function (req,res, next) {
    console.log(":((((")
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

module.exports = app;