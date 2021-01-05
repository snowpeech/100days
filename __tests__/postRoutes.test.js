process.env.NODE_ENV = "test";

const request = require("supertest"); //actually will test the routes. not needed to test the model
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = require("../app");
const db = require("../db");
const { SECRET } = require("../config");
const { token } = require("morgan");
const BCRYPT_WORK_FACTOR = 1;

let testUserToken;
let userId;
let goalId;

const noTknMsg = "You must be logged in to view this"
const authMsg = "Unauthorized user"

beforeEach(async () => {
    const hashedPassword = await bcrypt.hash("secret123", BCRYPT_WORK_FACTOR);
    
    const results = await db.query(
      `INSERT INTO users 
          (email, password, first_name, last_name)
          VALUES
          ('user@g.com', '${hashedPassword}', 'Kona', 'K'),
          ('user2@g.com', '${hashedPassword}', 'Sushi', 'Roll')
          RETURNING id, email`
    );
    userId = results.rows[0].id;

    const goalResults = await db.query(`
    INSERT INTO goals (user_id, goal)
    VALUES 
    (${userId},'first goal'), (${userId +1 },'not my goal')
    RETURNING goal_id`);
    
    goalId = goalResults.rows[0].goal_id; //store first goal_id
    results.rows[0].goals = [goalId]

    testUserToken = jwt.sign(results.rows[0], SECRET);

    await db.query(`INSERT INTO am (goal_id,day, gratitude_am, big_goal, task1, task2,task3) 
    VALUES (${goalId}, 1,'good sleep', 'starting goal', 'one','2','3');

    INSERT INTO pm (goal_id, day, gratitude_pm, obstacle1, solution1, discipline, overall_day,reflect)
        VALUES (${goalId},1,'good day','kid','Prioritize', 5,5,'Test reflect powers');

    INSERT INTO pm (goal_id, day, gratitude_pm, obstacle1, solution1, discipline, overall_day,reflect)
    VALUES (${goalId},10,'another day','dog','get stuff done first', 7,7,'Breathe more');

    INSERT INTO tendays (goal_id,day,accomplished, win1, win2, win3, win_plan1, bad1, bad2, bad3, solution1,microgoal)
        VALUES (${goalId}, 10, true, 'good week','new ideas', 'more creativity', 'meet one new person', 'slept in','stayed out late', 'too much prime rib', 'sleep by 10', 'make a goal');`)
});
   

afterEach(async () => {
    await db.query(` DELETE FROM am`);
    await db.query(` DELETE FROM pm`);
    await db.query(` DELETE FROM tendays`);
    await db.query(` DELETE FROM goals`);
    await db.query(` DELETE FROM users`);
});

afterAll(async () => {
    await db.end();
});

describe('test GET /posts', () =>{
    test("Gets all goal posts", async ()=>{
        const response = await request(app)
            .get(`/posts/${goalId}`)
            .send({_token: testUserToken}); 
        
        expect(response.statusCode).toBe(200);
        expect(response.body.posts.am.length).toBe(1);
        expect(response.body.posts.pm.length).toBe(2);
        expect(response.body.posts.tendays.length).toBe(1);
    })

    test("Gets goal posts for a given day", async ()=>{
        const dayResponse = await request(app)
            .get(`/posts/${goalId}/1`)
            .send({_token: testUserToken}); 
        
        expect(dayResponse.statusCode).toBe(200);
        expect(dayResponse.body.post.day.length).toBe(1);
        expect(dayResponse.body.post.ten).toBeUndefined();

        const tenResponse = await request(app)
            .get(`/posts/${goalId}/10`)
            .send({_token: testUserToken}); 
        
        expect(tenResponse.statusCode).toBe(200);
        expect(tenResponse.body.post.day.length).toBe(1);
        expect(tenResponse.body.post.ten.length).toBe(1);
    })

    test("Gets goal post for a given day and type", async ()=>{
        const amResponse = await request(app)
            .get(`/posts/${goalId}/1/am`)
            .send({_token: testUserToken}); 
        
        expect(amResponse.statusCode).toBe(200);
        expect(amResponse.body.post.goal_id).toBe(goalId);

        const pmResponse = await request(app)
            .get(`/posts/${goalId}/1/pm`)
            .send({_token: testUserToken}); 
        
        expect(pmResponse.statusCode).toBe(200);
        expect(pmResponse.body.post.goal_id).toBe(goalId);

        const tenResponse = await request(app)
            .get(`/posts/${goalId}/10/tendays`)
            .send({_token: testUserToken}); 
        
        expect(tenResponse.statusCode).toBe(200);
        expect(tenResponse.body.post.goal_id).toBe(goalId);
    })

    test("Gets PM metrics for a given day", async ()=>{
        const dayResponse = await request(app)
            .get(`/posts/${goalId}/10/metrics`)
            .send({_token: testUserToken}); 
        
        expect(dayResponse.statusCode).toBe(200);
        expect(dayResponse.body.metrics.length).toBe(2);
    })
    

    test("Returns error for bad token", async ()=>{
        //for goal
        let response = await request(app)
            .get(`/posts/${goalId}`)
            .send({_token: "testUserToken"}); 
        
        expect(response.statusCode).toBe(401);
        expect(response.body.error.message).toBe(authMsg);
    
        //for given day
        response = await request(app)
        .get(`/posts/${goalId}/1`)
        .send({_token: "testUserToken"}); 
    
        expect(response.statusCode).toBe(401);
        expect(response.body.error.message).toBe(authMsg);
        
        //for given day and type
        response = await request(app)
        .get(`/posts/${goalId}/1/am`)
        .send({_token: "testUserToken"}); 

        expect(response.statusCode).toBe(401);
        expect(response.body.error.message).toBe(authMsg);

        //for PM metrics
        response = await request(app)
        .get(`/posts/${goalId}/10/metrics`)
        .send({_token: "testUserToken"}); 

        expect(response.statusCode).toBe(401);
        expect(response.body.error.message).toBe(authMsg);
    })
    //get for each post type and day
    //also makes sure errror is returned for nonexistent combos and no token
    
})