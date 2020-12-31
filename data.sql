-- DROP DATABASE IF EXISTS hundreddays;

-- CREATE DATABASE hundreddays;

-- \c hundreddays;

DROP TABLE IF EXISTS users, goals, am, pm, tendays, tags, goal_tags;


CREATE TABLE users
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
    gratitude text NOT NULL,
    big_goal text NOT NULL,
    task1 text NOT NULL,
    task2 text NOT NULL,
    task3 text NOT NULL
);

CREATE TABLE pm
(
    goal_id INTEGER REFERENCES goals(goal_id) ON DELETE CASCADE,
    day SMALLINT NOT NULL,
    gratitude text NOT NULL,
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
    progress BOOLEAN NOT NULL,
    reflect text NOT NULL
);

CREATE TABLE tendays
(
    goal_id INTEGER REFERENCES goals(goal_id) ON DELETE CASCADE,
    day SMALLINT NOT NULL,
    progress BOOLEAN NOT NULL,
    win1 text NOT NULL,
    win2 text NOT NULL,
    win3 text NOT NULL,
    win_plan1 text NOT NULL,
    win_plan2 text,
    win_plan3 text,
    bad1 text NOT NULL,
    bad2 text NOT NULL,
    bad3 text NOT NULL,
    solution1 text NOT NULL,
    solution2 text,
    solution3 text,
    microgoal text NOT NULL
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


INSERT INTO users
    (email, password, first_name, last_name, location, gender, phone_num)
VALUES
    ('g@gmail.com', 'secret123', 'lulu', 'nan', 'austin', 'f', '123-456-0789');


INSERT INTO goals
    (user_id, goal)
    VALUES (1,'starting goal');

INSERT INTO tags 
    (tag) VALUES ('health'),('fitness'),('career'),('mental'),('spiritual'),('relationship'),('skill'),('music');

INSERT INTO goal_tags (goal_id, tag_id) VALUES (1,1),(1,2),(1,3);

INSERT INTO am (goal_id,day, gratitude, big_goal, task1, task2,task3) 
    VALUES (1, 1,'good sleep', 'starting goal', 'one','2','3');

INSERT INTO pm (goal_id, day, gratitude, obstacle1, solution1, discipline, overall_day, progress,reflect)
    VALUES (1,1,'good day','kid','get stuff done first', 5,5,true,'I think it was a good day, got fun things to do that were not goal related');

INSERT INTO tendays (goal_id,day,progress, win1, win2, win3, win_plan1, bad1, bad2, bad3, solution1,microgoal)
    VALUES (1, 10, true, 'good week','new ideas', 'more creativity', 'meet one new person', 'slept in','stayed out late', 'too much prime rib', 'sleep by 10', 'make a goal');

--not sure if tendays 'day' value should be 10 or 1 (x10)...tbd? maybe 10 so we can join and sort by day :)
-- should I do a 100day goal? And have the option to split it by 7 days rather than 10 day reflection periods

-- INSERT INTO pm (goal_id, day, gratitude, obstacle1, solution1, discipline, overall_day, progress,reflect)
--     VALUES (5,11,'sunshine day','cat','get stuff done first', 3,7,true,'I think it was a good day, got fun things to do that were not goal related');
