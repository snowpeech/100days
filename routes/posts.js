const express = require('express');
const db = require('../db');
const ExpressError = require('../helpers/expressError');
const router = new express.Router();
const { ensureLoggedIn } = require('../middleware/auth');
const Post = require('../models/post')

/* GET a goal's day's am and pm posts */
router.get('/:goalid/:day',async (req, res,next) => {
    try {
        //need to turn day into an Int
        // console.log(req.params.something)
        let result = await db.query(`
        SELECT *  from am 
        FULL OUTER JOIN pm ON am.day = pm.day AND am.goal_id = pm.goal_id
        WHERE (am.goal_id = $1 OR pm.goal_id = $1) 
        AND (am.day = $2 OR pm.day =$2 )
        `,[req.params.goalid, req.params.day])

        const post = result.rows[0]
        return res.json({post})
    } catch(e) {
        return next(e)
    }
})

/* GET a goal's am and pm posts */
router.get('/:goalid',async (req, res,next) => {
    try {
        //need to turn day into an Int
        // console.log(req.params.something)
        let result = await db.query(`
            SELECT * from am 
            FULL OUTER JOIN pm ON am.day = pm.day AND am.goal_id = pm.goal_id
            WHERE am.goal_id = $1 OR pm.goal_id = $1`,[req.params.goalid])
        const posts = result.rows[0]
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
        console.log("ROUTE METRICS", result)
        return res.json({metrics:result})
    } catch(e) {
        return next(e)
    }
})

/* GET user's latest posts??  */

/* post a goal's day's am post */
/* post a goal's day's pm post */
/* post a goal's day's 10day post */

/* update a goal's day's am post */
/* update a goal's day's pm post */
/* update a goal's day's 10day post */

/* delete a goal's day's am post */
/* delete a goal's day's pm post */
/* delete a goal's day's 10day post */


module.exports = router;