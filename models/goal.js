const db = require('../db')
// const {BCRYPT_WORK_FACTOR, SECRET} = require('../config')
const ExpressError = require('../helpers/expressError')
const sqlForPartialUpdate = require("../helpers/sqlForPartialUpdate")
const Tag = require("./tag")

class Goal {
    static async create({goal, userId, start_day, user_def1, user_def2, user_def3, tagArr}){
        let results;
        //can we make this better?
        if(start_day){
            console.log("WITH START:[userId, goal, start, user_def1, user_def2, user_def3]", [userId, goal, start_day, user_def1, user_def2, user_def3])

            results = await db.query(`
                    INSERT INTO goals
                    (user_id, goal, start_day, user_def1, user_def2, user_def3)
                    VALUES ($1, $2, $3, $4, $5)
                    RETURNING goal_id
                `, [userId, goal, start_day, user_def1, user_def2, user_def3]
                )
        } else {
            console.log("no start day:[userId, goal, user_def1, user_def2, user_def3]", [userId, goal, user_def1, user_def2, user_def3])
            results = await db.query(`
                    INSERT INTO goals
                    (user_id, goal, user_def1, user_def2, user_def3)
                    VALUES ($1, $2, $3, $4, $5)
                    RETURNING goal_id
                `, [userId, goal, user_def1, user_def2, user_def3]
                )

        }
        const goalId = results.rows[0].goal_id;

        let tagRes = await Tag.addTagsToGoal(tagArr,goalId)
        console.log("tagRes ROUTES",tagRes)
        return results.rows  
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
        // const results = await db.query(`SELECT * FROM goals WHERE goal_id = $1`,[goalId])
        
        if(!results.rows){
            throw new ExpressError(`Goal ${goalId} not found`, 404)
        }
        
        return results.rows[0]
        // let {goal, userId, start_day, user_def1, user_def2, user_def3} = results.rows[0];
        // let tags = result.rows.map(res => res.tag);
        // let goalObj = {goal, userId, start_day, user_def1, user_def2, user_def3, tags}
        
        // return goalObj
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
        
        const results = await db.query(`DELETE FROM goals WHERE goal_id = $1 RETURNING goal_id`, [goalId])
        return results.rows[0]
    }

    static async update(goalId, goalObj){
        //tbd FROM USERS.. need to figure out how to update tags. 
        //remove tags from partial update query..
        let tags;
        console.log("UPDATE IN GOAL")
        for (let key in goalObj) {
            if (key.startsWith("tag")) {
                tags = goalObj[key]
              delete goalObj[key]
            }
          }
        console.log("UPDATE. TAGS:",tags) 

        let { query, values } = sqlForPartialUpdate(
            "goals",
            goalObj,
            "goal_id",
            goalId
            );
            console.log("Q & V :::", query, values)
        const results = await db.query(`${query} RETURNING goal_id`, values);  
        console.log("RESULTS IN UPDATE ln 95",results)          
        const tagResults = await Tag.updateGoalTags(tags, goalId);
        console.log("GOAL MODEL tag results", tagResults)
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