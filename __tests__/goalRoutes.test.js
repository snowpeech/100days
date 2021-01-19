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

beforeAll(async () => {
    await db.query(`DROP TABLE IF EXISTS users, goals, am, pm, tendays, tags, goal_tags;`);
    await db.query(`CREATE TABLE users
    (
        id SERIAL PRIMARY KEY,
        email text UNIQUE NOT NULL,
        PASSWORD VARCHAR NOT NULL,
        first_name text NOT NULL,
        last_name text NOT NULL,
        location text,
        gender text,
        phone_num text,
    
        want_buddy BOOLEAN DEFAULT TRUE,
        has_buddy BOOLEAN DEFAULT FALSE,
        buddy_email text
    );
    
    CREATE TABLE goals
    (
        goal_id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        goal text NOT NULL,
    
        start_day DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        user_def1 text DEFAULT NULL,
        user_def2 text DEFAULT NULL,
        user_def3 text DEFAULT NULL
    );
    CREATE TABLE tags
    (
        tag_id SERIAL PRIMARY KEY,
        tag text UNIQUE NOT NULL
    );

    CREATE TABLE goal_tags
    (
        goal_id INTEGER NOT NULL REFERENCES goals(goal_id) ON DELETE CASCADE,
        tag_id INTEGER NOT NULL REFERENCES tags(tag_id) ON DELETE CASCADE,
        PRIMARY KEY (goal_id, tag_id)
    );
    `)
    await db.query(`INSERT INTO tags 
    (tag) VALUES ('health'),('fitness'),('career')`);
}) //need to follow with a delete all

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
    (${userId},'first goal'), (${userId},'another goal'), (${userId +1 },'not my goal')
    RETURNING goal_id`);
    
    goalId = goalResults.rows[0].goal_id; //store first goal_id
    results.rows[0].goals = [goalId, goalId +1]

    testUserToken = jwt.sign(results.rows[0], SECRET);
});
   

afterEach(async () => {
    await db.query(` DELETE FROM goal_tags`);
    await db.query(` DELETE FROM goals`);
    await db.query(` DELETE FROM users`);
});

afterAll(async () => {

    await db.end();
});

describe('test GET /goals', () =>{
    test("Returns all user's goals", async () => {
          const response = await request(app)
           .get(`/goals`)
           .send({_token: testUserToken}); 
           
          expect(response.statusCode).toBe(200);
          expect(response.body.goals.length).toBe(2);
    })  
    
    test("Returns user's single goal", async () => {
        const response = await request(app)
         .get(`/goals/${goalId}`)
         .send({_token: testUserToken}); 
         console.log(testUserToken, "TEST USER TOKEN", goalId, "GOAL ID")
         
        expect(response.statusCode).toBe(200);
        console.log(response.body, "RES BODY")
        expect(response.body.goal.user_id).toBe(userId);
        expect(response.body.goal.user_def1).toBeNull();
    })  
  
    test("Gets error without token", async () => {
    const response = await request(app)
     .get(`/goals`)
     
    expect(response.statusCode).toBe(401);
    expect(response.body.goals).toBeUndefined();

    const response2 = await request(app).get(`/goals/${goalId}`);

    expect(response2.statusCode).toBe(401);
    expect(response2.body.goal).toBeUndefined();    
    })  
})

describe('test POST /goals', () =>{
    test("Creates a new goal and returns updated token", async () => {
        const response = await request(app)
         .post(`/goals`)
         .send({goal:"testing in postman",
                user_def1:"mood", 
                tagArr:["health","fitness"],
                _token: testUserToken}); 
         //test tag behavior
        expect(response.statusCode).toBe(201);
        expect(response.body).toEqual(
            expect.objectContaining({ _token: expect.any(String) })
        );
        const newToken = response.body._token
        const getGoals = await request(app).get(`/goals`).send({_token:testUserToken});
        expect(getGoals.body.goals.length).toBe(3);
        
        let newGoalId = getGoals.body.goals[2].goal_id;
        const getGoal = await request(app).get(`/goals/${newGoalId}`)
        .send({_token:newToken});
        expect(getGoal.body.goal.tags[0]).toBe('health');
        expect(getGoal.body.goal.tags[1]).toBe('fitness');
      
    })

    test("Unable to create goal with improper data input", async () => {
        const response = await request(app)
        .post(`/goals`)
        .send({goal:"testing in postman",
            user_def1:"mood", 
            tagArr:[1,2],
            _token: testUserToken}); 
            
        expect(response.statusCode).toBe(400);
        expect(response.body.error.message.length).toBe(2);

        const getGoals = await request(app).get(`/goals`).send({_token:testUserToken});
        expect(getGoals.body.goals.length).toBe(2);        
    })

    test("Unable to create goal without token", async () => {
        const response = await request(app)
        .post(`/goals`)
        .send({goal:"testing in postman",
            user_def1:"mood", 
            tagArr:["health","fitness"]}); 
            
        expect(response.statusCode).toBe(401);
        expect(response.body.error.message).toBe(noTknMsg);

        const getGoals = await request(app).get(`/goals`).send({_token:testUserToken});
        expect(getGoals.body.goals.length).toBe(2);     
    })
})

describe('test UPDATE /goals', () => {
    test("Updates goal and returns updated token", async () => {
        const response = await request(app)
         .patch(`/goals/${goalId}`)
         .send({
            goal:"testing updates",
            user_def1:"mood", 
            tagArr:["health","fitness"],
            _token: testUserToken}); 

        expect(response.statusCode).toBe(200);
        expect(response.body.message).toBe("Goal updated");

        const getGoal = await request(app).get(`/goals/${goalId}`)
        .send({_token:testUserToken});
        expect(getGoal.body.goal.tags[0]).toBe('health');
        expect(getGoal.body.goal.tags[1]).toBe('fitness');
    })

    test("Unable to update goal without appropriate token", async () => {
        const response = await request(app)
        .patch(`/goals/${goalId}`)
        .send({
           goal:"testing updates",
           user_def1:"mood", 
           tagArr:["health","fitness"],
           _token: "faketoken"}); 

       expect(response.statusCode).toBe(401);
       expect(response.body.error.message).toBe("Unauthorized user");

       const getGoal = await request(app).get(`/goals/${goalId}`)
       .send({_token:testUserToken});
       expect(getGoal.body.goal.tags[0]).toBeNull();
    })

    test("Unable to update goal with improperly formatted input", async () => {
        const response = await request(app)
        .patch(`/goals/${goalId}`)
        .send({
           goal:"testing updates",
           user_def1:"mood", 
           tagArr:[1,2],
           _token: testUserToken}); 

       expect(response.statusCode).toBe(400);
       expect(response.body.error.message.length).toBe(2);

       const getGoal = await request(app).get(`/goals/${goalId}`)
       .send({_token:testUserToken});
       expect(getGoal.body.goal.tags[0]).toBeNull();
    })
})

describe('test DELETE /goals', () =>{
    //delete with token
    test("Deletes a goal and returns updated token", async () => {
        const response = await request(app)
         .delete(`/goals/${goalId}`)
         .send({_token: testUserToken}); 

        expect(response.statusCode).toBe(200);
        expect(response.body.message).toBe("Goal deleted");
        expect(response.body).toEqual(
            expect.objectContaining({ _token: expect.any(String) })
        );
        const newToken = response.body._token

        const getGoal = await request(app).get(`/goals`)
        .send({_token:newToken});
        expect(getGoal.body.goals.length).toBe(1);
    })
    //unable to delete without token
    test("Unable to delete goal with inappropriate token", async () => {
        const response = await request(app)
         .delete(`/goals/${goalId}`)
         .send({_token: "faketoken"}); 

        expect(response.statusCode).toBe(401);
        expect(response.body.error.message).toBe("Unauthorized user");
        
        const getGoal = await request(app).get(`/goals`)
        .send({_token:testUserToken});
        expect(getGoal.body.goals.length).toBe(2);
    })
})