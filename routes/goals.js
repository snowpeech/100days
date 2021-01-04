const express = require('express');
const ExpressError = require('../helpers/expressError');
const router = new express.Router();
const { ensureLoggedIn, ensureUserGoal } = require('../middleware/auth');
const Goal = require('../models/goal');

/* Create new goal, returns a token*/
router.post('/', ensureLoggedIn, async(req,res,next) => {
    try {
        //create new goal with user id from req.user
        req.body.user_id = req.user.id;
        
        let token = await Goal.create(req.body)

        return res.status(201).json({message:"Goal created", _token:token})
    } catch(e) {
        return next(e)
    }
})

/* gets user's goal by goal id, only visible to creating user (may change visibility) */
router.get('/:goalid', ensureUserGoal, async(req,res,next) => {
    try{
        let goal = await Goal.getOne(req.params.goalid);
        // if(goal[0].user_id !== req.user.id){
        //     throw new ExpressError("Unauthorized", 401)
        // }
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
        const response = await Goal.update(req.params.goalid, req.body)

        return res.json({msg:"updated"})
    } catch(e) {
        return next(e)
    }
})

/* delete's user's goal by goal id */
router.delete('/:goalid', ensureUserGoal, async(req,res,next)=>{
    try{
        let targetGoal = await Goal.getOne(req.params.goalid);

        if(targetGoal.user_id !== req.user.id){
            throw new ExpressError("Unauthorized", 401)
        }

        let token = await Goal.delete(req.params.goalid);

        return res.status(204).json({message: "Goal deleted", _token:token});

    } catch(e) {
        return next(e)
    }
})

module.exports = router;