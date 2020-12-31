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
})