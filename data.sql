DROP DATABASE IF EXISTS hundreddays;

CREATE DATABASE hundreddays;

\c hundreddays;

DROP TABLE IF EXISTS users;

CREATE TABLE users
(
    id SERIAL PRIMARY KEY,
    email text UNIQUE NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    time_zone text NOT NULL,
    location text,
    gender text,
    phone_num text,

    goal text NOT NULL,
    goal_tags text NOT NULL,
    user_def1 text DEFAULT NULL,
    user_def2 text DEFAULT NULL,
    user_def3 text DEFAULT NULL,

    want_buddy BOOLEAN DEFAULT TRUE,
    has_buddy BOOLEAN DEFAULT FALSE,
    buddy_email text
);

CREATE TABLE am
(
    user_id FOREIGN KEY REFERENCES users(id),
    gratitude text NOT NULL,
)

    INSERT INTO users
        (name, type)
    VALUES
        ('Juanita', 'admin');

    INSERT INTO users
        (name, type)
    VALUES
        ('Jenny', 'staff');

    INSERT INTO users
        (name, type)
    VALUES
        ('Jeff', 'user');

    INSERT INTO users
        (name, type)
    VALUES
        ('Jasmine', 'user');

    INSERT INTO users
        (name, type)
    VALUES
        ('James', 'staff');

    INSERT INTO users
        (name, type)
    VALUES
        ('Jaimee', 'admin');
