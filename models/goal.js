const db = require('../db')
const {BCRYPT_WORK_FACTOR, SECRET} = require('../config')
const ExpressError = require('../helpers/expressError')
const sqlForPartialUpdate = require("../helpers/sqlForPartialUpdate")

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
        // console.log("NEW GOAL ID:", goalId)
        //results = new goal id
        
        //create a sql string
        // console.log("tagArr", tagArr)
        let tagQuery = tagArr.map((val,ind) =>{return `tag =$${ind + 1} `}).join('OR ')
        //get tagids
        // console.log("tag query", tagQuery)
        let response = await db.query(`SELECT tag_id FROM tags WHERE ${tagQuery}`,tagArr)
        let tagIds = response.rows.map(val => {return Object.values(val)[0]});
        //create sql string with tagIds ($1, tagid), (),
        // console.log("tagIds", tagIds)
        let goalTagQuery = tagIds.map((val,ind) => {return `(${goalId}, $${ind +1}) `}).join();
        //insert into goal_tags table
        // console.log("goalTagQuery", goalTagQuery)
        let tagResults = await db.query(`INSERT INTO goal_tags (goal_id, tag_id) VALUES ${goalTagQuery}`,tagIds)
        console.log("tagResults",tagResults)
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
        const results = await db.query(`SELECT * FROM goals WHERE goal_id = $1`,[goalId])
        
        if(!results.rows){
            throw new ExpressError(`Goal ${goalId} not found`, 404)
        }
        
        return results.rows
    }

    static async delete(goalId){
        
        const results = await db.query(`DELETE FROM goals WHERE goal_id = $1 RETURNING goal_id`, [goalId])
        return results.rows[0]
    }

    static async update(goalId, goalObj){
        //tbd FROM USERS.. need to figure out how to update tags. 
        //remove tags from partial update query..
        let tags;
        for (let key in itemsObj) {
            if (key.startsWith("tag")) {
                tags = itemsObj[key]
              delete itemsObj[key]
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
        
        if(!results.rows[0]){
            throw new ExpressError(`User ${userId} not found`, 404)
        }
        return results.rows[0]
    }
}

module.exports = Goal

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