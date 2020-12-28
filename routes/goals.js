const express = require('express');
const ExpressError = require('../helpers/expressError');
const router = new express.Router();
const { ensureLoggedIn } = require('../middleware/auth');
const sqlForPartialUpdate = require('../helpers/sqlForPartialUpdate')
const Goal = require('../models/goal');

/* Create new goal */
router.post('/', ensureLoggedIn, async(req,res,next) => {
    try {
        //create new goal with user id from req.user
        let userId = req.user.id;
        console.log("POST USER ID", userId)

        let {goal, start_day, user_def1, user_def2, user_def3, tagArr} = req.body
        goalObj = {goal, userId, start_day, user_def1, user_def2, user_def3, tagArr}
        console.log("GOAL OBK::",goalObj)
        let response = await Goal.create(goalObj)

        return res.json({msg:"hello", response})
    } catch(e) {
        return next(e)
    }
})

/* gets user's goal by goal id, only visible to creating user (may change visibility) */
router.get('/:id', ensureLoggedIn, async(req,res,next) => {
    try{
        let goal = await Goal.getOne(req.params.id);
        if(goal[0].user_id !== req.user.id){
            throw new ExpressError("Unauthorized", 401)
        }
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

/* update user's goal */
router.post('/:id', ensureLoggedIn, async(req,res,next) => {
    try {
        //create new goal with user id from req.user
        let userId = req.user.id;
        console.log("POST USER ID", userId)

        if(deleteGoal[0].user_id !== req.user.id){
            throw new ExpressError("Unauthorized", 401)
        }


        let {goal, start_day, user_def1, user_def2, user_def3, tagArr} = req.body
        goalObj = {goal, userId, start_day, user_def1, user_def2, user_def3, tagArr}
        console.log("GOAL OBK::",goalObj)
        let response = await Goal.create(goalObj)

        return res.json({msg:"hello", response})
    } catch(e) {
        return next(e)
    }
})

/* delete's user's goal by goal id */
router.delete('/:id', ensureLoggedIn, async(req,res,next)=>{
    try{
        // let userId = req.user.id;
        let targetGoal = await Goal.getOne(req.params.id);

        if(targetGoal[0].user_id !== req.user.id){
            throw new ExpressError("Unauthorized", 401)
        }

        let response = await Goal.delete(req.params.id);

        return res.status(204).json({message: "Goal deleted"});

    } catch(e) {
        return next(e)
    }
})

module.exports = router;