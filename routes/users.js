const express = require('express');
const router = new express.Router();
const db = require("../db");
const sqlForPartialUpdate = require("../helpers/sqlForPartialUpdate")
const expressError = require('../helpers/expressError')
// const sqlForPost = require('../helpers/sqlForPost')

const User = require('../models/user') 

/* Register new user*/
router.post('/new', async (req,res,next) => {
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
router.patch('/:id/update', async (req, res, next) =>{
    try {
        const id = req.params.id;
        //should check if params id exists... 
        let { query, values } = sqlForPartialUpdate(
            "users",
            req.body,
            "id",
            req.params.id
          );
          const results = await db.query(
            `${query}`,
            values
          );
          if (!result.rows[0]) {
            throw new ExpressError(`User ID ${req.params.id} not found`, 404);
          }

          //need to either fix this or function to not return password
          return res.json(results.rows[0]);

    } catch(e){
        return next(e)
    }
})


/* delete a user - will need validation */
router.delete('/:id/delete', async (req, res, next) =>{
    try {
        const id = req.params.id;
        //should check if params id exists... 
        // let { query, values } = sqlForPartialUpdate(
        //     "users",
        //     req.body,
        //     "id",
        //     req.params.id
        //   );
        //   const result = await db.query(
        //     `${query}`,
        //     values
        //   );

        //   //need to either fix this or function to not return password
        //   
        const results = await db.query(`DELETE FROM users WHERE id = $1 RETURNING id, email`,
        [id])
        if (!results.rows[0]) {
            throw new ExpressError(`User ID ${req.params.id} not found`, 404);
          }
        return res.json(results.rows[0]);
    } catch(e){
        return next(e)
    }
})

module.exports = router;