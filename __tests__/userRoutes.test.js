process.env.NODE_ENV = "test";

const request = require("supertest"); //actually will test the routes. not needed to test the model
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = require("../app");
const db = require("../db");
const { SECRET } = require("../config");
const BCRYPT_WORK_FACTOR = 1;

let testUserToken;
let userId;

const loggedInErrMsg = "You must be logged in to view this";
const incorrectUserMsg = "Unauthorized user";

beforeEach(async () => {
    const hashedPassword = await bcrypt.hash("secret123", BCRYPT_WORK_FACTOR);
  
    const results = await db.query(
      `INSERT INTO users 
          (email, password, first_name, last_name)
          VALUES
          ('user@g.com', '${hashedPassword}', 'Kona', 'K'),
          ('user2@g.com', '${hashedPassword}', 'Hope', 'Lee')
          RETURNING id, email`
    );
    userId = results.rows[0].id;
    // const testUser = { username: "user[0]", is_admin: false };
    testUserToken = jwt.sign(results.rows[0], SECRET);
});


afterEach(async () => {
    await db.query(` DELETE FROM users`);
});

afterAll(async () => {
    await db.end();
});

describe('test GET /users', () =>{
  test("Returns all users", async () => {
        const response = await request(app)
         .get(`/users`)
         .send({_token: testUserToken}); 
         
        expect(response.statusCode).toBe(200);
        expect(response.body.users.length).toBe(2);
    
  })  
  
  test("Gets error message without token for GET /users", async () => {
    const response = await request(app)
     .get(`/users`)
     .send({_token: 'faketoken'}); 
     
    expect(response.statusCode).toBe(401);
    expect(response.body.error.message).toBe(loggedInErrMsg);
    expect(response.body.users).toBeUndefined();

})  

  test("Returns user by id with correct token", async () => {
    const response = await request(app)
     .get(`/users/${userId}`)
     .send({_token: testUserToken});

    expect(response.statusCode).toBe(200)
    expect(response.body.user.length).toBe(1);
    expect(response.body.user[0].email).toBe('user@g.com');
    expect(response.body.user[0].first_name).toBe('Kona');
    expect(response.body.user[0].last_name).toBe('K');
    expect(response.body.user[0].password).toBeUndefined();
  })

  test("Returns error message for incorrect userid", async () => {
    const response = await request(app)
     .get(`/users/0`)
     .send({_token: testUserToken});
     
    expect(response.statusCode).toBe(401);
    expect(response.body.user).toBeUndefined();
    expect(response.body.error.message).toBe(incorrectUserMsg);
  })

})

describe('test POST /users', () =>{
    test("Able to create new user and return a token", async () => {
        const response = await request(app)
           .post(`/users`)
           .send({
            "email":"test@gmail.com", 
            "password":"secret123",
            "first_name":"tester",
            "last_name":"testing",
            "phone_num":"1234567980"
            }); 
          
        expect(response.statusCode).toBe(201);
        expect(response.body).toEqual(
        expect.objectContaining({ _token: expect.any(String) })
        );
        expect(response.body.message).toEqual("User created")
    })  
    
    test("Error message for new user with incorrect data type", async () => {
        const response = await request(app)
        .post(`/users`)
        .send({
         "email":"test@gmail.com", 
         "password":"secret123",
         "first_name":"tester",
         "last_name":"testing",
         "phone_num":1234567980
         }); 
       
      expect(response.body.error.message).not.toBeUndefined();
      expect(response.statusCode).toBe(400);
    })

    test("Error message for new user without required information", async () => {
        const response = await request(app)
        .post(`/users`)
        .send({
         "password":"secret123",
         "first_name":"tester",
         "last_name":"testing",
         "phone_num":"1234567980"
         }); 
       
      expect(response.body.error.message).not.toBeUndefined();
      expect(response.statusCode).toBe(400);
    })

    test("Error message for duplicate email", async () => {
        const response = await request(app)
        .post(`/users`)
        .send({
         "email":"user@g.com",
         "password":"secret123",
         "first_name":"tester",
         "last_name":"testing",
         "phone_num":"1234567980"
         }); 
       
      expect(response.body.error.message).not.toBeUndefined();
      expect(response.statusCode).toBe(500);
    })
  
  })

describe('test PATCH /users/:id', () =>{
    test("Able to update user", async () => {
            const response = await request(app)
            .patch(`/users/${userId}`)
            .send({
            first_name:"new",
            last_name:"name",
            _token: testUserToken 
            }); //should add a .send({_token: testUserToken})
      
        expect(response.statusCode).toBe(200);
        expect(response.body.user.id).toBe(userId);
        expect(response.body.user.email).toBe('user@g.com');

        let res = await request(app).get(`/users/${userId}`).send({ _token: testUserToken})
      
        expect(res.body.user[0].first_name).toBe('new');
        expect(res.body.user[0].last_name).toBe('name');        
    })  

    test("Receive error message for updating incorrect user id", async () =>{
        const response = await request(app)
            .patch(`/users/0`)
            .send({
            first_name:"one",
            last_name:"two",
            _token: testUserToken 
            });

        expect(response.statusCode).toBe(401);
        expect(response.body.user).toBeUndefined();
        expect(response.body.error.message).toBe(incorrectUserMsg);
    })

    test("Error message for updating user email or password", async () => {
        const response = await request(app)
        .patch(`/users/${userId}`)
        .send({
            "email":"user2@g.com",
            "password":'somestring',
            "first_name":"tester",
            "last_name":"testing",
            "phone_num":"1234567980",
            _token: testUserToken 
            }); //update this when using jsonschema
        
        expect(response.body.error.message).not.toBeUndefined();
        expect(response.statusCode).toBe(400);    
    })

})

describe('test DELETE /users/:id', () =>{
    test("Able to delete user", async () => {
        const response = await request(app)
        .delete(`/users/${userId}`)
        .send({_token: testUserToken});
        
        expect(response.statusCode).toBe(204);
        // expect(response.message).toBe(`User ${userId} deleted`);
    
        let res = await request(app).get(`/users`).send({_token: testUserToken});
        expect(res.body.users.length).toBe(1);
       
    })  
    
    test("Receive error message for updating nonexistent user id", async () =>{
        const response = await request(app)
        .delete(`/users/0`)
        .send({_token: testUserToken});
        
        expect(response.statusCode).toBe(401);
        expect(response.body.user).toBeUndefined();
        expect(response.body.error.message).toBe(incorrectUserMsg);
    })  
})

  