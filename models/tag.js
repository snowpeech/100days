const db = require('../db')
// const ExpressError = require('../helpers/expressError')

class Tag {
    static async findIds(tagArr){
        /* FINDING TAG IDS AND ADDING THEM. YES THIS WILL GO TO A TAG CLASS */
        //create a sql string to get existing tag ids
        // console.log("tagArr", tagArr)
        const tagQuery = tagArr.map((val,ind) =>{return `tag =$${ind + 1} `}).join('OR ')
        //get tagids
        // console.log("tag query", tagQuery)
        const response = await db.query(`SELECT tag_id FROM tags WHERE ${tagQuery}`,tagArr)
        const tagIds = response.rows.map(val => {return Object.values(val)[0]});
        // console.log("tagIds", tagIds)
        return tagIds        
    }
    
    static async addTagsToGoal(tagArr, goalId){
        const tagIds = await this.findIds(tagArr);
        //create sql string with tagIds ($1, tagid), (),
        const goalTagQuery = tagIds.map((val,ind) => {return `(${goalId}, $${ind +1}) `}).join();
        //insert into goal_tags table
        // console.log("goalTagQuery", goalTagQuery)
        const tagResults = await db.query(`INSERT INTO goal_tags (goal_id, tag_id) 
            VALUES ${goalTagQuery}
            ON CONFLICT DO NOTHING
            RETURNING * `,tagIds)
        return tagResults
    }

    /*Removes goal_tags then inserts goals tags */
    static async updateGoalTags(tagArr, goalId){
        const deleteRes = await db.query(`DELETE FROM goal_tags WHERE goal_id = $1 RETURNING tag_id`,[goalId])
        console.log("DELETED TAGS", deleteRes)
        const addRes = await this.addTagsToGoal(tagArr,goalId);
        console.log("ADDED TAGS", addRes)
        return addRes;
    }

    
}

module.exports = Tag;