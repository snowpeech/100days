const db = require('../db')
// const {BCRYPT_WORK_FACTOR, SECRET} = require('../config')
const ExpressError = require('../helpers/expressError')
const sqlForPartialUpdate = require("../helpers/sqlForPartialUpdate")
const sqlForPost = require('../helpers/sqlForPost')

class Post {
    // static async newPost(table, postObj){
    //     const {queryStr, values} = sqlForPost(postObj,table);
    //     console.log("Q & V",queryStr,values)
    //     let result = await db.query(`${queryStr} RETURNING *`, values)
    //     console.log(result.rows)
    //     if(!result.rows[0]){
    //         throw new ExpressError("Error posting",404)
    //     }  
    //     return result.rows      
    // }
    static async newPost(table, postObj, goalId,day){
        //push goalId and day into postObj
        console.log("table",table,postObj, goalId,day)
        postObj["day"] =day;
        postObj["goal_id"]=goalId;
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
    static async getPostOfDay(table, goalId,day){
        let result = await db.query(`
            SELECT * from ${table} 
            WHERE goal_id = $1 AND day = $2
            `,[goalId, day])
        
            if(!result.rows[0]){
                throw new ExpressError("Goal has no posts of desired post-type for date",404)
            }
        return result.rows[0]
    }
    
    /* get all AM, PM, or a 10day post for a goal */
    static async getPostsOfGoal(table, goalId){
        let result = await db.query(`
            SELECT * from ${table} 
            WHERE goal_id = $1
            `,[goalId])
        
            if(!result.rows[0]){
                throw new ExpressError("Goal has no posts of desired post-type",404)
            }
        return result.rows[0]
    }

    /* get metrics for 10day summary. day is current day and will get past 10 days, inclusive */
    static async getMetrics(goalId, day){
        let result = await db.query(`
            SELECT day, discipline, overall_day, user_def1, user_def2, user_def3
            FROM pm WHERE (day > $1 AND day <= $2) AND goal_id = $3
            `,[(day-10), day, goalId])

            if(!result.rows[0]){
                throw new ExpressError("No data for day range",404)
            }

        return result.rows
    }
    /* get all of a goals' am/pm posts */
    static async getGoals(goalId){
        const amResult = await db.query(`SELECT * FROM am WHERE goal_id =$1 ORDER BY day`, [goalId]);
        const pmResult = await db.query(`SELECT * FROM pm WHERE goal_id =$1 ORDER BY day`, [goalId]);
        const tenResult = await db.query(`SELECT * FROM tendays WHERE goal_id =$1 ORDER BY day`, [goalId]);
        
        const posts={am:amResult.rows, pm:pmResult.rows, tendays:tenResult.rows}

        if(!amResult.rows[0] && !pmResult.rows[0] && !tenResult.rows[0]){
            throw new ExpressError("Goal has no posts",404)
        }
        return posts
    }

    static async getOneDay(goalId, day){
        let tenResult;
        let result = await db.query(`
        SELECT *  from am 
        FULL OUTER JOIN pm ON am.day = pm.day AND am.goal_id = pm.goal_id
        WHERE (am.goal_id = $1 OR pm.goal_id = $1) 
        AND (am.day = $2 OR pm.day =$2 )
        `,[goalId,day]);

        let post ={day:result.rows}

        if(day%10 === 0){
            tenResult = await db.query(`
            SELECT * FROM tendays 
            WHERE goal_id = $1 AND day = $2
            `, [goalId,day]);
            post.ten = tenResult.rows
        }

        if(!result.rows[0] && !tenResult.rows[0]){
            throw new ExpressError("No posts found for day and goal", 404)
        }

        return post
    }

    static async updatePost(table, postObj, goalId, day){
        const {queryStr, values} = sqlForPartialUpdate(table,postObj,goalId,day);
        console.log("Q & V",queryStr,values)
        let result = await db.query(`${queryStr} RETURNING *`, values)
        console.log(result.rows)
        if(!result.rows[0]){
            throw new ExpressError("Goal / day post does not exist",404)
        }  
        return result.rows   
    }

    static async deletePost(table, goalId, day){
        
        let result = await db.query(`
            DELETE FROM ${table} WHERE goal_id =$1 AND day =$2 
            RETURNING goal_id, day`,[goalId,day])
        if(!result.rows[0]){
            throw new ExpressError("Goal / day post does not exist",404)
        }
        return result.rows
    }
}

module.exports = Post;


// SELECT  am.day AS am_day, am.gratitude_am, am.big_goal, am.task1, am.task2,am.task3 , 
// pm.day AS pm_day, pm.gratitude_pm, pm.obstacle1 , pm.obstacle2 , pm.obstacle3 , pm.solution1 , pm.solution2 , pm.solution3 , pm.discipline , pm.overall_day , pm.user_def1 ,    pm.user_def2 ,    pm.user_def3 ,    pm.reflect,
// t.day AS ten_day, t.accomplished, t.win1, t.win2, t.win3, t.win_plan1, t.win_plan2, t.win_plan3, t.bad1, t.bad2, t.bad3, t.solution1, t.solution2, t.solution3, t.microgoal
// FROM am 
// FULL OUTER JOIN pm ON am.day = pm.day 
//     AND am.goal_id = pm.goal_id
// FULL OUTER JOIN tendays AS t ON pm.day = t.day 
//     AND pm.goal_id = t.goal_id
// WHERE am.goal_id = 10 OR pm.goal_id = 10  OR t.goal_id = 10 
// ORDER BY am_day, pm_day, ten_day