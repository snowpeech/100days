const jwt = require('jsonwebtoken')
const db = require('../db')
const {SECRET} = require('../config')
const ExpressError = require('../helpers/expressError')
const sqlForPartialUpdate = require("../helpers/sqlForPartialUpdate")
const sqlForPost = require('../helpers/sqlForPost')
const Tag = require("./tag")

class Goal {
    static async create(goalObj){
        
        // filter out tagArr  
        const {tagArr} = goalObj
        delete goalObj[tagArr];

        const {queryStr, values} = sqlForPost(goalObj,"goals");
        console.log("Q&V:::",queryStr, values)
        const results = await db.query(`${queryStr} RETURNING * `,values)
        console.log(results.rows)
        const goalId = results.rows[0].goal_id;
        if(tagArr){
            let tagRes = await Tag.addTagsToGoal(tagArr,goalId)
            console.log("TAG RES:",tagRes)
        }
        
        let token = this.updateTokenGoals(goalObj.user_id)
        return token
    }

    static async updateTokenGoals(userId){
        const result = await db.query(`
            SELECT u.id, u.email, g.goal_id
            FROM users AS u
            INNER JOIN goals AS g
            ON u.id = g.user_id
            WHERE u.id = $1;`,[userId])
            
        let {id, email} = result.rows[0];
        let goals = result.rows.map(r => r.goal_id);
        let user = {id, email, goals}
        console.log("LOGIN USER",user)
        
        let token = jwt.sign(user, SECRET); 
        return token;
    }

    static async getAll(userId){
        const results = await db.query(`SELECT * FROM goals WHERE user_id = $1`,[userId])
        
        if(!results.rows){
            throw new ExpressError(`User ${userId} not found`, 404)
        }

        return results.rows
    }

    static async getOne(goalId){
        
        const results = await db.query(`
        SELECT * FROM goals WHERE goal_id = $1`,[goalId])
        
        if(!results.rows){
            throw new ExpressError(`Goal ${goalId} not found`, 404)
        }
        
        return results.rows[0]
    }

    static async getOneWithTags(goalId){
        const results = await db.query(`
        SELECT g.goal, g.start_day, g.user_def1, g.user_def2, g.user_def3 
            FROM goals AS g 
            LEFT JOIN goal_tags AS gt ON g.goal_id = gt.goal_id
            LEFT JOIN tags AS t ON gt.tag_id = t.tag_id
            WHERE g.goal_id = $1`,[goalId])
        // const results = await db.query(`SELECT * FROM goals WHERE goal_id = $1`,[goalId])
        
        if(!results.rows){
            throw new ExpressError(`Goal ${goalId} not found`, 404)
        }
        
        let {goal, userId, start_day, user_def1, user_def2, user_def3} = results.rows[0];
        let tags = result.rows.map(res => res.tag);
        let goalObj = {goal, userId, start_day, user_def1, user_def2, user_def3, tags}
        
        return goalObj
    }

    static async delete(goalId){
        
        const results = await db.query(`DELETE FROM goals WHERE goal_id = $1 RETURNING user_id`, [goalId])
        let token = this.updateTokenGoals(results.rows[0].user_id)
        
        return token
    }

    static async update(goalId, goalObj){
        //remove tags and add in.. 
        let tags;
        
        for (let key in goalObj) {
            if (key.startsWith("tag")) {
                tags = goalObj[key]
              delete goalObj[key]
            }
          }

        let { queryStr, values } = sqlForPartialUpdate(
            "goals",
            goalObj,
            "goal_id",
            goalId
            );
            console.log("Q & V :::", queryStr, values)
        const results = await db.query(`${queryStr} RETURNING goal_id`, values);  
                 
        const tagResults = await Tag.updateGoalTags(tags, goalId);
        
        if(!results.rows[0]){
            throw new ExpressError(`User ${userId} not found`, 404)
        }

        return results.rows[0]
    }
}

module.exports = Goal;

// INSERT INTO goals
//             (user_id, goal, start_day)
//             VALUES ($1, $2, $3)

            
// INSERT INTO goals
// (user_id, goal, start_day)
// VALUES (24, 'test');

// INSERT INTO tags (tag) VALUES ('happiness'), ('health'), ('relationships');

// INSERT INTO goal_tags values (1, 1);

//need to check if tag exists in table, if not create it
//add into goals_tags table, the proper link