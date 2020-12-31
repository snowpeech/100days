const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
const db = require('../db')
const {BCRYPT_WORK_FACTOR, SECRET} = require('../config')
const ExpressError = require('../helpers/expressError')
const sqlForPartialUpdate = require("../helpers/sqlForPartialUpdate")

class User {
    static async register({email, password, first_name, last_name, location, gender, phone_num}) {
        
        let hashedPassword = await  bcrypt.hash(password,BCRYPT_WORK_FACTOR);
        //need to check if email already exists. if so return error this logic doesn't belong here
        const results = await db.query(`
            INSERT INTO users 
            (email, password, first_name, last_name, location, gender, phone_num) 
            VALUES ($1, $2, $3, $4, $5,$6,$7) RETURNING id, email
        `,[email, hashedPassword, first_name, last_name, location, gender, phone_num]);
        
        let user = results.rows[0]
        console.log("NEW USER ID:",user.id)
        let token = jwt.sign(user,SECRET)
        
        return token;
    }

    static async login(email,passwordIn){
        // const result = await db.query(
        //     `SELECT id, email, password, first_name, last_name FROM users WHERE email = $1`,
        //     [email]
        //   );
        // let user = result.rows[0];
        //can change what we're selecting. currently not using first & last name
        const result = await db.query(`SELECT u.id, u.email, u.password, g.goal_id
        FROM users AS u
        INNER JOIN goals AS g
        ON u.id = g.user_id
        WHERE email = $1;
        `,[email])
        
        let {id, password} = result.rows[0];
        let goals = result.rows.map(r => r.goal_id);
        let user = {id, email, goals}
        
        if (user && (await bcrypt.compare(passwordIn, password))) {
            
            let token = jwt.sign(user, SECRET); 
            
            return token;
        } else {
            throw new ExpressError("Wrong password/username", 400);
        }
    }

    static async getAll(){
        const results = await db.query(`SELECT id, email, first_name FROM users`)
        
        return results.rows;
    }

    static async getOne(userId){
        const results = await db.query(`SELECT id, email, first_name, last_name, location, gender, phone_num, want_buddy, has_buddy,buddy_email 
        FROM users
        WHERE id=$1`, [userId]);
        if (!results.rows[0]){
            throw new ExpressError(`User ${userId} not found`, 404)
        }
        return results.rows;
    }

    static async update(userId,updateObj){
         
        let { query, values } = sqlForPartialUpdate(
            "users",
            updateObj,
            "id",
            userId
            );
        const results = await db.query(`${query} RETURNING id, email`, values);            
        //need to update to hash password if part of update... use jsonschema to not allow password updates
        if(!results.rows[0]){
            throw new ExpressError(`User ${userId} not found`, 404)
        }
        return results.rows[0]
    }

    static async delete(userId){
        const results = await db.query(`DELETE FROM users WHERE id = $1 RETURNING id, email`,
        [userId])

        if (!results.rows[0]) {
            throw new ExpressError(`User ${userId} not found`, 404)
          }
          
        return results.rows[0];
    }
}

module.exports= User;

// SELECT u.id, u.email, u.password, g.goal_id
// FROM users AS u
// INNER JOIN goals AS g
// ON u.id = g.user_id
// WHERE email = 'jojo@gmail.com';
