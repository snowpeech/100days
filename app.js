const express = require("express");
const app = express();
const cors = require("cors");
const morgan = require('morgan');

const ExpressError = require("./helpers/expressError");
const userRoutes = require("./routes/users");
const goalRoutes = require("./routes/goals")
const {authenticateJWT} = require('./middleware/auth')

app.use(express.json()); // Parse request bodies for JSON
app.use(cors());
app.use(morgan("tiny"));
app.use(authenticateJWT);

/* routes */
app.use("/users", userRoutes);
app.use("/goals", goalRoutes);

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