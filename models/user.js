const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
const db = require('../db')

class User {
    static async register(userObj) {
        let {password} = userObj;
        let hashedPassword = await  bcrypt.hash(password,BCRYPT_WORK_FACTOR);
        obj['password'] = hashedPassword;

        const result = await db.query(`INSERT INTO users (email, password, first_name, last_name, location, gender, phone_num) VALUES ($1, $2, $3, $4, $5,$6,$7) RETURNING email`,[email, password, first_name, last_name, location, gender, phone_num]);
        //will need to add jwt here with email?
        return results.rows[0]
    }
}

module.exports= User;