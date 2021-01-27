const { request } = require('express')
const db = require('../db')
const ExpressError = require('../helpers/expressError')
const sqlForPost = require('../helpers/sqlForPost')
const sqlForPostUpdate = require('../helpers/sqlForPostUpdate')

class Post {

    static async newPost(table, postObj, goalId,day){
        //push goalId and day into postObj
        postObj["day"] =day;
        postObj["goal_id"]=goalId;
        const {queryStr, values} = sqlForPost(postObj,table);
        
        let result = await db.query(`${queryStr} RETURNING *`, values)
        
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
                result.rows = "No metrics for day range"
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
        // const post = {"ten":""};
        let result = await db.query(`
        SELECT *  from am 
        FULL OUTER JOIN pm ON am.day = pm.day AND am.goal_id = pm.goal_id
        WHERE (am.goal_id = $1 OR pm.goal_id = $1) 
        AND (am.day = $2 OR pm.day =$2 )
        `,[goalId,day]);

        let post =result.rows[0] ? result.rows[0] : {};
        
        if(day%10 === 0){
            tenResult = await db.query(`
            SELECT * FROM tendays 
            WHERE goal_id = $1 AND day = $2
            `, [goalId,day]);
            
            if(tenResult.rows.length > 0){
                post["ten"] = tenResult.rows[0]
            }
            
        }

        if(!result.rows && !tenResult.rows){
            throw new ExpressError("No posts found for day and goal", 404)
        }

        return post
    }

    static async updatePost(table, postObj, goalId, day){
        const {queryStr, values} = sqlForPostUpdate(table,postObj,goalId,day);
        
        let result = await db.query(`${queryStr} RETURNING *`, values)
        
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