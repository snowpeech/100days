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

    CREATE TABLE am
    (
        goal_id INTEGER REFERENCES goals(goal_id) ON DELETE CASCADE,
        day SMALLINT NOT NULL,
        gratitude_am text NOT NULL,
        big_goal text NOT NULL,
        task1 text NOT NULL,
        task2 text ,
        task3 text,
        PRIMARY KEY (goal_id, day) 
    );
    
    CREATE TABLE pm
    (
        goal_id INTEGER REFERENCES goals(goal_id) ON DELETE CASCADE,
        day SMALLINT NOT NULL,
        gratitude_pm text NOT NULL,
        obstacle1 text NOT NULL,
        obstacle2 text ,
        obstacle3 text ,
        solution1 text NOT NULL,
        solution2 text,
        solution3 text,
        discipline SMALLINT NOT NULL,
        overall_day SMALLINT NOT NULL,
        user_def1 SMALLINT DEFAULT NULL,
        user_def2 SMALLINT DEFAULT NULL,
        user_def3 SMALLINT DEFAULT NULL,
        reflect text NOT NULL,
        PRIMARY KEY (goal_id, day)
    );
    
    CREATE TABLE tendays
    (
        goal_id INTEGER REFERENCES goals(goal_id) ON DELETE CASCADE,
        day SMALLINT NOT NULL,
        accomplished BOOLEAN NOT NULL,
        win1 text NOT NULL,
        win2 text ,
        win3 text ,
        win_plan1 text NOT NULL,
        win_plan2 text,
        win_plan3 text,
        bad1 text NOT NULL,
        bad2 text ,
        bad3 text ,
        solution1 text NOT NULL,
        solution2 text,
        solution3 text,
        microgoal text NOT NULL,
        PRIMARY KEY (goal_id, day)
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
        console.log("POST DAY", dayResponse.body.post.day, dayResponse.body.post.day.length)
        expect(dayResponse.body.post.day.length).toBe(1);
        expect(dayResponse.body.post.ten).toBeUndefined();

        const tenResponse = await request(app)
            .get(`/posts/${goalId}/10`)
            .send({_token: testUserToken}); 
            console.log("POST 10DAY", dayResponse.body.post.day, dayResponse.body.post.day.length)
        expect(tenResponse.statusCode).toBe(200);
        expect(tenResponse.body.post.day).toBe("10");
        expect(tenResponse.body.post.ten.day).toBe(10);
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
    

    // test("Returns error for bad token", async ()=>{
    //     //for goal
    //     let response = await request(app)
    //         .get(`/posts/${goalId}`)
    //         .send({_token: "testUserToken"}); 
        
    //     expect(response.statusCode).toBe(401);
    //     expect(response.body.error.message).toBe(authMsg);
    
    //     //for given day
    //     response = await request(app)
    //     .get(`/posts/${goalId}/1`)
    //     .send({_token: "testUserToken"}); 
    
    //     expect(response.statusCode).toBe(401);
    //     expect(response.body.error.message).toBe(authMsg);
        
    //     //for given day and type
    //     response = await request(app)
    //     .get(`/posts/${goalId}/1/am`)
    //     .send({_token: "testUserToken"}); 

    //     expect(response.statusCode).toBe(401);
    //     expect(response.body.error.message).toBe(authMsg);

    //     //for PM metrics
    //     response = await request(app)
    //     .get(`/posts/${goalId}/10/metrics`)
    //     .send({_token: "testUserToken"}); 

    //     expect(response.statusCode).toBe(401);
    //     expect(response.body.error.message).toBe(authMsg);
    // })
})

// describe('test POST /posts', () =>{
//     test("Posts new AM post", async ()=>{
//         let response = await request(app)
//             .post(`/posts/${goalId}/3/am`)
//             .send({
//                 gratitude_am:"sun", 
//                 big_goal:"yay", 
//                 task1:"a", 
//                 task2:"b",
//                 task3:"c",                
//                 _token: testUserToken}); 
//         expect(response.statusCode).toBe(200);
//         expect(response.body.message).toBe("success");
        
//         response = await request(app)
//             .get(`/posts/${goalId}`)
//             .send({_token: testUserToken});
//         expect(response.body.posts.am.length).toBe(2);
//         expect(response.body.posts.pm.length).toBe(2);
//         expect(response.body.posts.tendays.length).toBe(1);
//     })

//     test("AM post not posted without required info", async ()=>{
//         let response = await request(app)
//             .post(`/posts/${goalId}/3/am`)
//             .send({
//                 gratitude_am:"sun", 
//                 big_goal:"yay", 
//                 task2:"b",
//                 task3:"c",                
//                 _token: testUserToken}); 

//         expect(response.statusCode).toBe(400);
//         expect(response.body.error.message[0]).toBe('instance requires property \"task1\"');
        
//         response = await request(app)
//             .get(`/posts/${goalId}`)
//             .send({_token: testUserToken});
//         expect(response.body.posts.am.length).toBe(1);
//     })

//     test("Posts new PM post", async ()=>{
//         let response = await request(app)
//             .post(`/posts/${goalId}/3/pm`)
//             .send({
//                 gratitude_pm:"family",
//                 obstacle1:"tired", 
//                 solution1:"none", 
//                 discipline:5, 
//                 overall_day:8,
//                 reflect:"life is still good",                
//                 _token: testUserToken}); 


//         expect(response.statusCode).toBe(200);
//         expect(response.body.message).toBe("success");
        
//         response = await request(app)
//             .get(`/posts/${goalId}`)
//             .send({_token: testUserToken});
//         expect(response.body.posts.am.length).toBe(1);
//         expect(response.body.posts.pm.length).toBe(3);
//         expect(response.body.posts.tendays.length).toBe(1);
//     })

//     test("PM post not posted with bad info", async ()=>{
//         //missing field
//         let response = await request(app)
//             .post(`/posts/${goalId}/3/pm`)
//             .send({
//                 "obstacle1":"tired", 
//                 "solution1":"none", 
//                 "discipline":5, 
//                 "overall_day":8, 
//                 "progress":true,
//                 "reflect":"life is still good",                
//                 _token: testUserToken}); 

//         expect(response.statusCode).toBe(400);
//         expect(response.body.error.message[0]).toBe('instance requires property \"gratitude_pm\"');
        
//         //extra field
//         response = await request(app)
//             .post(`/posts/${goalId}/3/pm`)
//             .send({
//                 "gratitude_pm":"family",
//                 "extra_field":"random text",
//                 "obstacle1":"tired", 
//                 "solution1":"none", 
//                 "discipline":5, 
//                 "overall_day":8, 
//                 "progress":true,
//                 "reflect":"life is still good",                
//                 _token: testUserToken}); 

//         expect(response.statusCode).toBe(400);
//         expect(response.body.error.message[0]).toBe('instance is not allowed to have the additional property \"extra_field\"');
        
//         //improper data format
//         response = await request(app)
//         .post(`/posts/${goalId}/3/pm`)
//         .send({
//             "gratitude_pm":"family",
//             "obstacle1":"tired", 
//             "solution1":"none", 
//             "discipline":"TEXT NOT INT", 
//             "overall_day":8, 
//             "progress":true,
//             "reflect":"life is still good",                
//             _token: testUserToken}); 

//         expect(response.statusCode).toBe(400);
//         expect(response.body.error.message[0]).toBe('instance.discipline is not of a type(s) integer');

//         response = await request(app)
//             .get(`/posts/${goalId}`)
//             .send({_token: testUserToken});
//         expect(response.body.posts.pm.length).toBe(2);
//     })

//     test("Posts new tendays post", async ()=>{
//         let response = await request(app)
//             .post(`/posts/${goalId}/30/tendays`)
//             .send({
//                 "accomplished": true,
//                 "win1": "some text",
//                 "win2": "some text",
//                 "win3": "some text",
//                 "win_plan1": "some text",
//                 "win_plan2": "some text",
//                 "win_plan3": "some text",
//                 "bad1": "some text",
//                 "bad2": "some text",
//                 "bad3": "some text",
//                 "solution1": "some text",
//                 "solution2": "some text",
//                 "solution3": "some text",
//                 "microgoal": "some text",
//                     "_token": testUserToken
//                 }); 

//         expect(response.statusCode).toBe(200);
//         expect(response.body.message).toBe("success");
        
//         response = await request(app)
//             .get(`/posts/${goalId}`)
//             .send({_token: testUserToken});
//         expect(response.body.posts.am.length).toBe(1);
//         expect(response.body.posts.pm.length).toBe(2);
//         expect(response.body.posts.tendays.length).toBe(2);
//     })

//     test("tenday post not posted with bad info", async ()=>{
//         //extra field
//         response = await request(app)
//             .post(`/posts/${goalId}/30/tendays`)
//             .send({"accomplished": true,
//                 "extra_field":"blah",
//                 "win1": "some text",
//                 "win_plan1": "some text",
//                 "bad1": "some text",
//                 "solution1": "some text",
//                 "microgoal": "some text",
//                 _token: testUserToken}); 

//         expect(response.statusCode).toBe(400);
//         expect(response.body.error.message[0]).toBe('instance is not allowed to have the additional property \"extra_field\"');
        
//         //improper data format
//         response = await request(app)
//             .post(`/posts/${goalId}/30/tendays`)
//             .send({
//                 "accomplished": "true",
//                 "extra_field":"blah",
//                 "win1": "some text",
//                 "win_plan1": "some text",
//                 "bad1": "some text",
//                 "solution1": "some text",
//                 "microgoal": "some text",
//                 _token: testUserToken}); 

//         expect(response.statusCode).toBe(400);
//         expect(response.body.error.message[0]).toBe('instance.accomplished is not of a type(s) boolean');

//         response = await request(app)
//             .get(`/posts/${goalId}`)
//             .send({_token: testUserToken});
//         expect(response.body.posts.tendays.length).toBe(1);
//     })

//     test("Can't post without token", async ()=>{
//         let response = await request(app)
//         .post(`/posts/${goalId}/3/am`)
//         .send({
//             gratitude_am:"sun", 
//             big_goal:"yay", 
//             task2:"b",
//             task3:"c",                
//             _token: "testUserToken"}); 

//     expect(response.statusCode).toBe(401);
//     expect(response.body.error.message).toBe(authMsg);
    
//     response = await request(app)
//         .get(`/posts/${goalId}`)
//         .send({_token: testUserToken});
//     expect(response.body.posts.am.length).toBe(1);
//     })

//     test("Can't post over existing post", async ()=>{
//         let response = await request(app)
//             .post(`/posts/${goalId}/1/am`)
//             .send({
//                 gratitude_am:"sun", 
//                 big_goal:"yay", 
//                 task1:"a",
//                 task2:"b",
//                 task3:"c",                
//                 _token: testUserToken}); 
        
//         expect(response.statusCode).toBe(500);
//         expect(response.body.error.message).toBe('duplicate key value violates unique constraint \"am_pkey\"');
        
//         response = await request(app)
//             .get(`/posts/${goalId}`)
//             .send({_token: testUserToken});
//         expect(response.body.posts.am.length).toBe(1);
//     })
// })

// describe('test PATCH /posts', () =>{
//     test("Updates AM post", async ()=>{
//         let response = await request(app)
//             .patch(`/posts/${goalId}/1/am`)
//             .send({
//                 gratitude_am:":)",      
//                 _token: testUserToken}); 
//         expect(response.statusCode).toBe(200);
//         expect(response.body.message).toBe("success");
        
//         response = await request(app)
//             .get(`/posts/${goalId}/1/am`)
//             .send({_token: testUserToken});
//         expect(response.body.post.gratitude_am).toBe(":)");
//     })

//     test("AM post not updated with additional info", async ()=>{
//         let response = await request(app)
//             .patch(`/posts/${goalId}/1/am`)
//             .send({
//                 gratitude_am:":)",
//                 extra_field:"blah",      
//                 _token: testUserToken}); 

//                 expect(response.statusCode).toBe(400);
//                 expect(response.body.error.message[0]).toBe('instance is not allowed to have the additional property \"extra_field\"');        
        
//         response = await request(app)
//             .get(`/posts/${goalId}/1/am`)
//             .send({_token: testUserToken});
//         expect(response.body.post.gratitude_am).toBe("good sleep");
//     })

//     test("Updates PM post", async ()=>{
//         let response = await request(app)
//             .patch(`/posts/${goalId}/1/pm`)
//             .send({
//                 gratitude_pm:":)",      
//                 _token: testUserToken}); 
//         expect(response.statusCode).toBe(200);
//         expect(response.body.message).toBe("success");
        
//         response = await request(app)
//             .get(`/posts/${goalId}/1/pm`)
//             .send({_token: testUserToken});
//         expect(response.body.post.gratitude_pm).toBe(":)");
//     })

//     test("PM post not updated with additional info", async ()=>{
//         let response = await request(app)
//             .patch(`/posts/${goalId}/1/pm`)
//             .send({
//                 gratitude_pm:":)",
//                 extra_field:"blah",      
//                 _token: testUserToken}); 

//                 expect(response.statusCode).toBe(400);
//                 expect(response.body.error.message[0]).toBe('instance is not allowed to have the additional property \"extra_field\"');        
        
//         response = await request(app)
//             .get(`/posts/${goalId}/1/pm`)
//             .send({_token: testUserToken});
//         expect(response.body.post.gratitude_pm).toBe("good day");
//     })

//     test("Updates tenday post", async ()=>{
//         let response = await request(app)
//             .patch(`/posts/${goalId}/10/tendays`)
//             .send({
//                 win1:":)",
//                 _token: testUserToken}); 
//         expect(response.statusCode).toBe(200);
//         expect(response.body.message).toBe("success");
        
//         response = await request(app)
//             .get(`/posts/${goalId}/10/tendays`)
//             .send({_token: testUserToken});
//         expect(response.body.post.win1).toBe(":)");
//     })

//     test("Tenday post not updated with additional info", async ()=>{
//         let response = await request(app)
//             .patch(`/posts/${goalId}/10/tendays`)
//             .send({
//                 win1:":)",
//                 extra_field:"blah",      
//                 _token: testUserToken}); 

//                 expect(response.statusCode).toBe(400);
//                 expect(response.body.error.message[0]).toBe('instance is not allowed to have the additional property \"extra_field\"');        
        
//             response = await request(app)
//                 .get(`/posts/${goalId}/10/tendays`)
//                 .send({_token: testUserToken});
//             expect(response.body.post.win1).toBe("good week");
//     })

//     test("Receive error for updating non-existent day/post", async()=>{
//         let response = await request(app)
//             .patch(`/posts/${goalId}/2/am`)
//             .send({
//                 gratitude_am:":)",      
//                 _token: testUserToken}); 
//         expect(response.statusCode).toBe(404);
//         expect(response.body.error.message).toBe("Goal / day post does not exist");
//     })
// })

// ////////////////////
// describe('test DELETE /posts', () =>{
//     test("Deletes a user's post", async ()=>{
//         let response = await request(app)
//             .delete(`/posts/${goalId}/1/am`)
//             .send({_token: testUserToken}); 
        
//         expect(response.statusCode).toBe(200);

//         response = await request(app)
//             .delete(`/posts/${goalId}/1/pm`)
//             .send({_token: testUserToken}); 
        
//         expect(response.statusCode).toBe(200);

//         response = await request(app)
//             .delete(`/posts/${goalId}/10/tendays`)
//             .send({_token: testUserToken}); 
        
//         expect(response.statusCode).toBe(200);

//         response = await request(app)
//             .get(`/posts/${goalId}`)
//             .send({_token: testUserToken});

//         expect(response.body.posts.am.length).toBe(0);
//         expect(response.body.posts.pm.length).toBe(1);
//         expect(response.body.posts.tendays.length).toBe(0);
//     })

//     test("Can't delete without token", async ()=>{
//         let response = await request(app)
//             .delete(`/posts/${goalId}/1/am`)
//             .send({_token: "testUserToken"}); 
//         expect(response.statusCode).toBe(401);

//         response = await request(app)
//             .delete(`/posts/${goalId}/1/pm`)
//             .send({_token: "testUserToken"}); 
        
//         expect(response.statusCode).toBe(401);

//         response = await request(app)
//             .delete(`/posts/${goalId}/10/tendays`)
//             .send({_token: "testUserToken"}); 
        
//         expect(response.statusCode).toBe(401);

//         response = await request(app)
//             .get(`/posts/${goalId}`)
//             .send({_token: testUserToken}); 

//         expect(response.body.posts.am.length).toBe(1);
//         expect(response.body.posts.pm.length).toBe(2);
//         expect(response.body.posts.tendays.length).toBe(1);
//     })

//     test("Returns error message for deleting nonexistent post", async ()=>{
//         let response = await request(app)
//             .delete(`/posts/${goalId}/2/am`)
//             .send({_token: testUserToken}); 
        
//         expect(response.statusCode).toBe(404);
//         expect(response.body.error.message).toBe("Goal / day post does not exist");
//     })

// })
