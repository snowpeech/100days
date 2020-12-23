const express = require('express');
const router = new express.Router();
const db = require("../db");

const expressError = require('../helpers/expressError')
// const sqlForPost = require('../helpers/sqlForPost')

const User = require('../models/user') 

/* Register new user*/
router.post('/', async (req,res,next) => {
    try {
    const {email, password, first_name, last_name, location, gender, phone_num} = req.body 
    //if not provided ,is undefined
    const userObj = {email, password, first_name, last_name, location, gender, phone_num};
    
    let newUser = await User.register(userObj);
    
    return res.status(201).json({user:newUser});
    } catch(e) {
        return next(e)
    }
})

/* gets all users from database */
router.get('/', async (req,res,next) => {
    try{
        const allUsers = await User.getAll()
        
        return res.json({users:allUsers})
    } catch(e) {
        return next(e)
    }
})

/* get a single user by ID */
router.get('/:id', async (req,res, next)=> {
    try {
        const userInfo = await User.getOne(req.params.id);
        
        return res.json({user:userInfo});

    } catch(e) {
        return next(e)
    }
});


/* update a user - will need validation */
router.patch('/:id', async (req, res, next) =>{
    try {
        const response = await User.update(req.params.id,req.body)
            
        return res.json({user: response});

    } catch(e){
        return next(e)
    }
})


/* delete a user - will need validation */
router.delete('/:id', async (req, res, next) =>{
    try {
        const response = await User.delete(req.params.id);

        console.log('user route', response)
        // console.log(res.status(204).json({"message":`User ${req.params.id} deleted`}))
        // console.log('user route', res.status(204).json({message:response}))
        // return res.status(204).json({ message: "User deleted" });
        return res.status(204).json({user: response});

    } catch(e){
        return next(e)
    }
})

module.exports = router;