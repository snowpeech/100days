const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
const db = require('../db')
const {BCRYPT_WORK_FACTOR, SECRET} = require('../config')
const ExpressError = require('../helpers/expressError')
const sqlForPartialUpdate = require("../helpers/sqlForPartialUpdate")

class User {
    /* Register new user, returns token */
    static async register({email, password, first_name, last_name, location, gender, phone_num}) {
        
        let hashedPassword = await  bcrypt.hash(password,BCRYPT_WORK_FACTOR);
        //need to check if email already exists. if so return error this logic doesn't belong here
        const results = await db.query(`
            INSERT INTO users 
            (email, password, first_name, last_name, location, gender, phone_num) 
            VALUES ($1, $2, $3, $4, $5,$6,$7) RETURNING id, email
        `,[email, hashedPassword, first_name, last_name, location, gender, phone_num]);
        
        let user = results.rows[0]
        user.goals=[];
        let token = jwt.sign(user,SECRET)
        
        return token;
    }

    /*Log in user, returns token */
    static async login(email,passwordIn){
        
        const result = await db.query(`
            SELECT u.id, u.email, u.password, g.goal_id
            FROM users AS u
            INNER JOIN goals AS g
            ON u.id = g.user_id
            WHERE u.email = $1;`,[email])
        console.log(result.rows[0], "DB RESULT")
        let {id, password} = result.rows[0];
        let goals = result.rows.map(r => r.goal_id);
        let user = {id, email, goals}
        console.log("LOGIN USER",user)
        if (user && (await bcrypt.compare(passwordIn, password))) {
            
            let token = jwt.sign(user, SECRET); 
            
            return token;
        } else {
            throw new ExpressError("Wrong password/username", 400);
        }
    }

    /* get all users */
    static async getAll(){
        const results = await db.query(`SELECT id, email, first_name FROM users`)
        
        return results.rows;
    }

    /* get a user */
    static async getOne(userId){
        const results = await db.query(`SELECT id, email, first_name, last_name, location, gender, phone_num, want_buddy, has_buddy,buddy_email 
        FROM users
        WHERE id=$1`, [userId]);
        if (!results.rows[0]){
            throw new ExpressError(`User ${userId} not found`, 404)
        }
        return results.rows;
    }

    /* update a user */
    static async update(userId,updateObj){
        let { queryStr, values } = sqlForPartialUpdate(
            "users",
            updateObj,
            "id",
            userId
            );

        const results = await db.query(`${queryStr} RETURNING id, email`, values);            

        if(!results.rows[0]){
            throw new ExpressError(`User ${userId} not found`, 404)
        }
        return results.rows[0]
    }

    /*delete a user*/
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
