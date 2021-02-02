const express = require('express');
const jsonschema =require('jsonschema');
const ExpressError = require('../helpers/expressError');
const router = new express.Router();
const { ensureUserGoal } = require('../middleware/auth');
const { getOneDay } = require('../models/post');
const Post = require('../models/post')
const amSchema = require('../schemas/amSchema.json');
const amUpdateSchema = require('../schemas/amUpdateSchema.json');
const pmSchema = require('../schemas/pmSchema.json');
const pmUpdateSchema = require('../schemas/pmUpdateSchema.json');
const tenSchema = require('../schemas/tenSchema.json');
const tenUpdateSchema = require('../schemas/tenUpdateSchema.json');


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
            result.metrics = metrics
        }

        return res.json({post:result})
    } catch(e) {
        return next(e)
    }
})

/* GET a goal's day's am, pm, (& tenday - if applicable) posts */
router.get('/:goalid/:day',ensureUserGoal, async (req, res,next) => {
    try {
        const {day, goalid} = req.params;
        let post = await getOneDay(goalid, day)
        post.goal_id = goalid;
        post.day = day;
        
        return res.json(post)
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

/* GET user's latest posts??  */

/* POST a goal's day's post */
router.post('/:goalid/:day/:posttype', ensureUserGoal, async (req,res,next) => {
    try {
        const {goalid, day, posttype} = req.params
        
        let result;
        switch(posttype){
            case 'am':
                result = jsonschema.validate(req.body,amSchema);
                break;
            case 'pm':
                result = jsonschema.validate(req.body,pmSchema);
                break;
            case 'tendays':
                result = jsonschema.validate(req.body,tenSchema);
                break;
            default:
                break;
        }
        if(!result.valid){
            let listOfErrors = result.errors.map(error => error.stack);
            let error = new ExpressError(listOfErrors, 400);
            return next(error);
        }

        const response = await Post.newPost(posttype, req.body,goalid,day)
        if(!response){throw new ExpressError("Error processing", 404)}
        return res.json({message:"success"})
    } catch(e) {
        return next(e)
    }
})

/* update a goal's day's specific post  */
router.patch('/:goalid/:day/:posttype', ensureUserGoal, async (req,res,next) => {
    try {
        const {goalid, day,posttype} = req.params;
        let result;
        switch(posttype){
            case 'am':
                result = jsonschema.validate(req.body,amUpdateSchema);
                break;
            case 'pm':
                result = jsonschema.validate(req.body,pmUpdateSchema);
                break;
            case 'tendays':
                result = jsonschema.validate(req.body,tenUpdateSchema);
                break;
            default:
                break;
        }
        if(!result.valid){
            let listOfErrors = result.errors.map(error => error.stack);
            let error = new ExpressError(listOfErrors, 400);
            return next(error);
        }


        const response = await Post.updatePost(posttype,req.body,goalid,day)
        if(!response){throw new ExpressError("Error processing", 404)}
        return res.json({message:"success"})
    } catch(e) {
        return next(e)
    }
})

/* delete a goal's day's post */
router.delete('/:goalid/:day/:posttype', ensureUserGoal, async (req,res,next) => {
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