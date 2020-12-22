const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
const db = require('../db')
const {BCRYPT_WORK_FACTOR} = require('../config')
const expressError = require('../helpers/expressError')

class User {
    static async register({email, password, first_name, last_name, location, gender, phone_num}) {
        
        let hashedPassword = await  bcrypt.hash(password,BCRYPT_WORK_FACTOR);
        //need to check if email already exists. if so return error this logic doesn't belong here
        const results = await db.query(`
            INSERT INTO users 
            (email, password, first_name, last_name, location, gender, phone_num) 
            VALUES ($1, $2, $3, $4, $5,$6,$7) RETURNING id, email
        `,[email, hashedPassword, first_name, last_name, location, gender, phone_num]);
        //will need to add jwt here with email?
        
        return results.rows[0];
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
            throw new expressError(`User ${userId} Not Found`, 404)
        }
        return results.rows;
    }


}

module.exports= User;