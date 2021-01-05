const express = require('express');
const ExpressError = require('../helpers/expressError');
const router = new express.Router();
const { ensureLoggedIn, ensureUserGoal } = require('../middleware/auth');
const Goal = require('../models/goal');
const jsonschema =require('jsonschema');
const goalSchema = require('../schemas/goalSchema.json')
const goalUpdateSchema = require('../schemas/goalUpdateSchema.json')

/* Create new goal, returns a token*/
router.post('/', ensureLoggedIn, async(req,res,next) => {
    try {
        //validate goal
        req.body.user_id = req.user.id;
        const result = jsonschema.validate(req.body, goalSchema);
        
        if(!result.valid){
            let listOfErrors = result.errors.map(error => error.stack);
            let error = new ExpressError(listOfErrors, 400);
            return next(error);
        }

        //create new goal with user id from req.user
        let token = await Goal.create(req.body)
        
        return res.status(201).json({message:"Goal created", _token:token})
    } catch(e) {
        return next(e)
    }
})

/* gets user's goal by goal id, only visible to creating user (may change visibility) */
router.get('/:goalid', ensureUserGoal, async(req,res,next) => {
    try{
        let goal = await Goal.getOneWithTags(req.params.goalid);
        
        return res.json({goal})
    } catch(e) {
        return next(e)
    }
})

/* returns all of user's goals */
router.get('/', ensureLoggedIn, async(req,res,next) => {
    try{
        let userId = req.user.id;
        let goals = await Goal.getAll(userId);
        
        return res.json({goals})
    } catch(e) {
        return next(e)
    }
})

/* update user's goal by goal id */
router.patch('/:goalid', ensureUserGoal, async(req,res,next) => {
    try {

        const result = jsonschema.validate(req.body, goalUpdateSchema);
        
        if(!result.valid){
            let listOfErrors = result.errors.map(error => error.stack);
            let error = new ExpressError(listOfErrors, 400);
            return next(error);
        }

        const response = await Goal.update(req.params.goalid, req.body)
        if(!response){throw new ExpressError("Error updating goal",400)}

        return res.json({message:"Goal updated"})
    } catch(e) {
        return next(e)
    }
})

/* delete's user's goal by goal id */
router.delete('/:goalid', ensureUserGoal, async(req,res,next)=>{
    try{
        let token = await Goal.delete(req.params.goalid);
        console.log("DELETED GOAL TON", token)
        
        // return res.status(204).json({message: "Goal deleted", _token:token});
        //json isn't returned if status is defined :( 
        return res.json({message: "Goal deleted", _token:token});
    } catch(e) {
        return next(e)
    }
})

module.exports = router;