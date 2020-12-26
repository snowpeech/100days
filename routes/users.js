const express = require('express');
const ExpressError = require('../helpers/expressError');
const router = new express.Router();
const { ensureLoggedIn, ensureCorrectUser} = require('../middleware/auth')
const User = require('../models/user') 
const jsonschema = require('jsonschema');
const userSchema = require('../schemas/userSchema.json')
const updateUserSchema = require('../schemas/updateUserSchema.json')

/* Register new user*/
router.post('/', async (req,res,next) => {
    try {
        const result = jsonschema.validate(req.body, userSchema);
        
        if(!result.valid){
            let listOfErrors = result.errors.map(error => error.stack);
            let error = new ExpressError(listOfErrors, 400);
            return next(error);
        }

        const {email, password, first_name, last_name, location, gender, phone_num} = req.body 
        const userObj = {email, password, first_name, last_name, location, gender, phone_num};
        
        let token = await User.register(userObj);
        
        // return res.status(201).json({user:newUser});
        return res.status(201).json({message:"User created", _token:token})

    } catch(e) {
        return next(e)
    }
})

/* login with email & password. returns with token */
router.post('/login', async (req,res,next) => {
    try{
        const {email, password} = req.body;
        if(!email || !password){
            //easier than using another schema
            throw new ExpressError("Username and password required", 404)
        }
        let token = await User.login(email, password);
        
        return res.json({message:"Logged in", _token:token})

    } catch(e) {
        return next(e)
    }
})

/* gets all users from database . May eventually remove this method or just make it unavailable*/
router.get('/', ensureLoggedIn, async (req,res,next) => {
    try{
        const allUsers = await User.getAll()
        
        return res.json({users:allUsers})
    } catch(e) {
        return next(e)
    }
})

/* get a single user by ID */
router.get('/:id', ensureCorrectUser, async (req,res, next)=> {
    try {
        const userInfo = await User.getOne(req.params.id);
        
        return res.json({user:userInfo});

    } catch(e) {
        return next(e)
    }
});


/* update a user - will need validation */
router.patch('/:id',ensureCorrectUser, async (req, res, next) =>{
    try {
        const result = jsonschema.validate(req.body, updateUserSchema);
        
        if(!result.valid){
            let listOfErrors = result.errors.map(error => error.stack);
            let error = new ExpressError(listOfErrors, 400);
            return next(error);
        }

        const response = await User.update(req.params.id,req.body)
            
        return res.json({user: response});

    } catch(e){
        return next(e)
    }
})


/* delete a user - will need validation */
router.delete('/:id', ensureCorrectUser, async (req, res, next) =>{
    try {
        const response = await User.delete(req.params.id);

        return res.status(204).json({user: response});
    } catch(e){
        return next(e)
    }
})

module.exports = router;