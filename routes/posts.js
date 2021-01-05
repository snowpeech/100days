const express = require('express');
const db = require('../db');
const ExpressError = require('../helpers/expressError');
const router = new express.Router();
const { ensureUserGoal } = require('../middleware/auth');
const { getOneDay } = require('../models/post');
const Post = require('../models/post')

const sqlForPost = require('../helpers/sqlForPost')

/* GET a goal's day's am and pm posts */
router.get('/:goalid/:day',ensureUserGoal, async (req, res,next) => {
    try {
        let post = await getOneDay(req.params.goalid, req.params.day)
        return res.json({post})
    } catch(e) {
        return next(e)
    }
})

/* GET all of goal's posts - {posts: am:[], pm:[], tendays:[]} */
router.get('/:goalid', ensureUserGoal, async (req, res,next) => {
    try {
        let posts = await Post.getGoals(req.params.goalid);
        return res.json({posts})
    } catch(e) {
        return next(e)
    }
})

/* GET PM metrics for 10day */ 
router.get('/:goalid/:day/metrics',ensureUserGoal, async (req, res,next) => {
    try {
        const result = await Post.getMetrics(req.params.goalid, req.params.day)
        
        return res.json({metrics:result})
    } catch(e) {
        return next(e)
    }
})

/* GET a goal's day's post: "am", "pm", "tendays" */
router.get('/:goalid/:day/:posttype',ensureUserGoal, async (req, res,next) => {
    try {

        const result = await Post.getPostOfDay(req.params.posttype,req.params.goalid, req.params.day);
        if(req.params.posttype == 'tendays'){
            const metrics = await Post.getMetrics(req.params.goalid, req.params.day)
            console.log("metrics!!!!!", metrics)
            result.metrics = metrics
        }

        return res.json({post:result})
    } catch(e) {
        return next(e)
    }
})

/* GET user's latest posts??  */

/* POST a goal's day's post */
router.post('/:goalid/:day/:posttype', ensureUserGoal, async (req,res,next) => {
    try {
        const {goalid, day, posttype} = req.params
        const response = await Post.newPost(posttype, req.body,goalid,day)
        if(!response){throw new ExpressError("Error processing", 404)}
        return res.json({message:"success"})
    } catch(e) {
        return next(e)
    }
})

/* update a goal's day's am post */
router.post('/:goalid/:day/:posttype/update', ensureUserGoal, async (req,res,next) => {
    try {
        const {goalid, day,posttype} = req.params
        
        const response = await Post.updatePost(posttype,req.body,goalid,day)
        if(!response){throw new ExpressError("Error processing", 404)}
        return res.json({message:"success"})
    } catch(e) {
        return next(e)
    }
})

/* delete a goal's day's post */
router.delete('/:goalid/:day/:posttype/delete', ensureUserGoal, async (req,res,next) => {
    try {
        const {goalid, day,posttype} = req.params

        const response = await Post.deletePost(posttype,goalid,day)
        
        if(!response){throw new ExpressError("Error processing", 404)}
        
        return res.json({message:`day: ${day} ${posttype} of goal: ${goalid} -  deleted`})
    } catch(e) {
        return next(e)
    }
})

module.exports = router;