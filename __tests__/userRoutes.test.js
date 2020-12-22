process.env.NODE_ENV = "test";

const request = require("supertest"); //actually will test the routes. not needed to test the model
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = require("../app");
const db = require("../db");
const { SECRET_KEY } = require("../config");
const BCRYPT_WORK_FACTOR = 1;

let testUserToken;
let userId;

beforeEach(async () => {
    const hashedPassword = await bcrypt.hash("secret123", BCRYPT_WORK_FACTOR);
  
    const results = await db.query(
      `INSERT INTO users 
          (email, password, first_name, last_name)
          VALUES
          ('user@g.com', '${hashedPassword}', 'Kona', 'K'),
          ('user2@g.com', '${hashedPassword}', 'Hope', 'Lee')
          RETURNING id`
    );
    userId = results.rows[0].id;
    // const testUser = { username: "user[0]", is_admin: false };
  
    // testUserToken = jwt.sign(testUser, SECRET_KEY);
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
         .get(`/users`); //should add a .send({_token: testUserToken})
        
        expect(response.statusCode).toBe(200);
        expect(response.body.users.length).toBe(2);
    
  })  

  test("Returns user by id", async () => {
    const response = await request(app)
     .get(`/users/${userId}`);

    expect(response.statusCode).toBe(200)
    expect(response.body.user.length).toBe(1);
    expect(response.body.user[0].email).toBe('user@g.com');
    expect(response.body.user[0].first_name).toBe('Kona');
    expect(response.body.user[0].last_name).toBe('K');
    expect(response.body.user[0].password).toBeUndefined();
  })

  test("Returns error message for incorrect userid", async () => {
    const response = await request(app)
     .get(`/users/0`);
     
    //  console.log(response)
    expect(response.statusCode).toBe(404);
    expect(response.body.user).toBeUndefined();
    expect(response.body.error.message).toBe('User 0 Not Found');
  })

})

describe('test POST /users/new', async () =>{
    test("Able to create new user", async () => {
          const response = await request(app)
           .post(`/users/new`)
           .send({
            "email":"test@gmail.com", 
            "password":"secret123",
            "first_name":"tester",
            "last_name":"testing",
            "phone_num":"1234567980"
            }); //should add a .send({_token: testUserToken})
          
          expect(response.statusCode).toBe(201);
          expect(response.body.user.id).not.toBeUndefined();
          expect(response.body.user.email).toBe("test@gmail.com");
      
    })  
  
    test("Error message for new user without required information", async () => {
      const response = await request(app)
       .get(`/users/${userId}`);
  
      expect(response.body.user.length).toBe(1);
      expect(response.body.user[0].email).toBe('user@g.com');
      expect(response.body.user[0].first_name).toBe('Kona');
      expect(response.body.user[0].last_name).toBe('K');
      expect(response.body.user[0].password).toBeUndefined();
    })
  
  })

  