const express = require('express');
const router = new express.Router();
const db = require("../db");
const sqlForPartialUpdate = require("../helpers/sqlForPartialUpdate")
const sqlForPost = require('../helpers/sqlForPost')

const User = require('../models/user')
/* Register new user*/
router.post('/new', async (req,res,next) => {
    try {
    const {email, password, first_name, last_name, location, gender, phone_num} = req.body 
    //if not provided ,is undefined
   
    //need to check if email already exists. if so return error this logic doesn't belong here

    let results = await db.query(`INSERT INTO users (email, password, first_name, last_name, location, gender, phone_num) VALUES ($1, $2, $3, $4, $5,$6,$7) RETURNING email`,[email, password, first_name, last_name, location, gender, phone_num])
    return res.json(results.rows)
    } catch(e) {
        return next(e)
    }
})

router.get('/:id', async (req,res, next)=> {
    try {const id = req.params.id;
    console.log(id) 
    //will become findone method in class
    const results = await db.query(`SELECT id, email, first_name, last_name, location, gender, phone_num, want_buddy, has_buddy,buddy_email 
    FROM users
    WHERE id=$1`, [id]);
    console.log(results)
    return res.json(results.rows);
    } catch(e) {
        return next(e)
    }
});

router.patch('/:id/update', async (req, res, next) =>{
    try {
        const id = req.params.id;

        let { query, values } = sqlForPartialUpdate(
            "users",
            req.body,
            "id",
            req.params.id
          );
          const result = await db.query(
            `${query}`,
            values
          );
          if (!result.rows[0]) {
            throw new ExpressError(`User ID ${req.params.id} not found`, 404);
          }

          //need to either fix this or function to not return password
          return res.json(result.rows[0]);

    } catch(e){
        return next(e)
    }
})

module.exports = router;