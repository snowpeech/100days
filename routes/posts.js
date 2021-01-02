const express = require('express');
const db = require('../db');
const ExpressError = require('../helpers/expressError');
const router = new express.Router();
const { ensureLoggedIn } = require('../middleware/auth');
const { getOneDay } = require('../models/post');
const Post = require('../models/post')

const sqlForPost = require('../helpers/sqlForPost')

/* GET a goal's day's am and pm posts */
router.get('/:goalid/:day',async (req, res,next) => {
    try {
        //need to turn day into an Int
        // console.log(req.params.something)
        // let result = await db.query(`
        // SELECT *  from am 
        // FULL OUTER JOIN pm ON am.day = pm.day AND am.goal_id = pm.goal_id
        // WHERE (am.goal_id = $1 OR pm.goal_id = $1) 
        // AND (am.day = $2 OR pm.day =$2 )
        // `,[req.params.goalid, req.params.day])

        // const post = result.rows[0]
        let post = await getOneDay(req.params.goalid, req.params.day)
        return res.json({post})
    } catch(e) {
        return next(e)
    }
})

/* GET a goal's posts, excluding 10day */
router.get('/:goalid',async (req, res,next) => {
    try {
        let posts = await Post.getGoals(req.params.goalid);
        return res.json({posts})
    } catch(e) {
        return next(e)
    }
})

/* GET a goal's day's am post */
router.get('/:goalid/:day/am',async (req, res,next) => {
    try {

        const result = await Post.getMid('am',req.params.goalid, req.params.day);

        return res.json({post:result})
    } catch(e) {
        return next(e)
    }
})

/* GET a goal's day's pm post */
router.get('/:goalid/:day/pm',async (req, res,next) => {
    try {
        const result = await Post.getMid('pm',req.params.goalid, req.params.day);
        return res.json({post:result})
    } catch(e) {
        return next(e)
    }
})

/* GET a goal's day's 10day post */
router.get('/:goalid/:day/tendays',async (req, res,next) => {
    try {
        const result = await Post.getMid('tendays',req.params.goalid, req.params.day);
        return res.json({post:result})
    } catch(e) {
        return next(e)
    }
})

/* GET PM metrics for 10day */
router.get('/:goalid/:day/metrics',async (req, res,next) => {
    try {
        const result = await Post.getMetrics(req.params.goalid, req.params.day)
        
        return res.json({metrics:result})
    } catch(e) {
        return next(e)
    }
})

/* GET user's latest posts??  */

/* post a goal's day's am post */
router.post('/:goalid/:day/am', async (req,res,next) => {
    try {
        const {goalid, day} = req.params
        const {gratitude_am, big_goal, task1, task2,task3} = req.body 
        const postObj ={goal_id:goalid, day, gratitude_am, big_goal, task1, task2,task3}
        
        const response = await Post.newPost('am',postObj)
        if(!response){throw new ExpressError("Error processing", 404)}
        return res.json({message:"success"})
    } catch(e) {
        return next(e)
    }
})
/* post a goal's day's pm post */
router.post('/:goalid/:day/pm', async (req,res,next) => {
    try {
        const {goalid, day} = req.params
        const {gratitude_pm, obstacle1, obstacle2, obstacle3, solution1, solution2, solution3, discipline, overall_day, user_def1, user_def2, user_def3, progress, reflect} = req.body 
        const postObj ={goal_id:goalid, day, gratitude_pm, obstacle1, obstacle2, obstacle3, solution1, solution2, solution3, discipline, overall_day, user_def1, user_def2, user_def3, progress, reflect}
    
        const response = await Post.newPost('pm',postObj)
        if(!response){throw new ExpressError("Error processing", 404)}
        return res.json({message:"success"})
    } catch(e) {
        return next(e)
    }
})

router.post('/:goalid/:day/tendays', async (req,res,next) => {
    try {
        const {goalid, day} = req.params
        const {accomplished, win1,win2,win3,win_plan1, win_plan2, win_plan3, bad1, bad2, bad3, solution1, solution2, solution3, microgoal} = req.body 
        const postObj ={goal_id:goalid, day, accomplished, win1,win2,win3,win_plan1, win_plan2, win_plan3, bad1, bad2, bad3, solution1, solution2, solution3, microgoal}
        
        const response = await Post.newPost('tendays',postObj)
        if(!response){throw new ExpressError("Error processing", 404)}
        return res.json({message:"success"})
    } catch(e) {
        return next(e)
    }
})
/* post a goal's day's 10day post */

/* update a goal's day's am post */
/* update a goal's day's pm post */
/* update a goal's day's 10day post */

/* delete a goal's day's am post */
/* delete a goal's day's pm post */
/* delete a goal's day's 10day post */


module.exports = router;