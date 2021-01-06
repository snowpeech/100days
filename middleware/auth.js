const jwt = require('jsonwebtoken')
const {SECRET} = require('../config');
const ExpressError = require('../helpers/expressError');

/* check token and add payload to user */
function authenticateJWT(req, res, next) {
    try {
      const tokenFromBody = req.body._token;
      const payload = jwt.verify(tokenFromBody, SECRET);
      req.user = payload;
      
      return next();
      // error in this middleware just means no token. can continue on
    } catch (err) {
      
        return next();
    
    }
  }

function ensureLoggedIn(req,res,next){
    if(!req.user){
        const err = new ExpressError("You must be logged in to view this", 401);
        return next(err)
    } else {
        return next()
    }
}

function ensureCorrectUser(req,res,next){    
    try{
        if(+req.user.id === +req.params.id){
            return next();
        } else {
            const err = new ExpressError("Unauthorized user", 401);
            return next(err)
        }
    } catch (err) {
        return next(err)
    }
}

function ensureUserGoal(req,res,next){    
    try{
        if(!req.user || !req.user.goals){
            const err = new ExpressError("Unauthorized user", 401);
            return next(err);
        } else {
            if(req.user.goals.includes(+req.params.goalid) ){
                return next();
            } else {
                const err = new ExpressError("Unauthorized user", 401);
                return next(err)
            }
    }
    } catch (err) {
        return next(err)
    }
}

module.exports = {
    authenticateJWT,
    ensureLoggedIn,
    ensureCorrectUser,
    ensureUserGoal
};