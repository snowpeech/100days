const db = require('../db')
// const {BCRYPT_WORK_FACTOR, SECRET} = require('../config')
const ExpressError = require('../helpers/expressError')
const sqlForPartialUpdate = require("../helpers/sqlForPartialUpdate")
const sqlForPost = require('../helpers/sqlForPost')

class Post {
    static async newPost(table, postObj){
        const {queryStr, values} = sqlForPost(postObj,table);
        console.log("Q & V",queryStr,values)
        let result = await db.query(`${queryStr} RETURNING *`, values)
        console.log(result.rows)
        if(!result.rows[0]){
            throw new ExpressError("Error posting",404)
        }  
        return result.rows      
    }

    /* get AM, PM, or a 10day post for a single goal and day */
    static async getMid(table, goalId,day){
        let result = await db.query(`
            SELECT * from ${table} 
            WHERE goal_id = $1 AND day = $2
            `,[goalId, day])
        
            if(!result.rows[0]){
                throw new ExpressError("Goal/day/post-type has no result",404)
            }
        return result.rows[0]
    }

    /* get metrics for 10day summary. day is current day and will get past 10 days */
    static async getMetrics(goalId, day){
        let result = await db.query(`
            SELECT discipline, overall_day, user_def1, user_def2, user_def3
            FROM pm WHERE (day > $1 AND day <= $2) AND goal_id = $3
            `,[(day-10), day, goalId])

            if(!result.rows[0]){
                throw new ExpressError("No data for day range",404)
            }

        return result.rows
    }
    /* get all of a goals' am/pm posts */
    static async getGoals(goalId){
        let result = await db.query(`
            SELECT * from am 
            FULL OUTER JOIN pm ON am.day = pm.day 
                AND am.goal_id = pm.goal_id
            WHERE am.goal_id = $1 OR pm.goal_id = $1`,[goalId])
        
        if(!result.rows[0]){
            throw new ExpressError("Goal has no posts",404)
        }
        return result.rows[0]
    }

    static async getOneDay(goalId, day){
        let result = await db.query(`
        SELECT *  from am 
        FULL OUTER JOIN pm ON am.day = pm.day AND am.goal_id = pm.goal_id
        WHERE (am.goal_id = $1 OR pm.goal_id = $1) 
        AND (am.day = $2 OR pm.day =$2 )
        `,[goalId,day])

        if(!result.rows[0]){
            throw new ExpressError("No posts found for day and goal", 404)
        }

        return result.rows[0]
        
    }
}

module.exports = Post;