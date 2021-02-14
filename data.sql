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


-- INSERT INTO users
--     (email, password, first_name, last_name)
-- VALUES
--     ('g@gmail.com', 'secret123', 'lulu', 'nan');


-- INSERT INTO goals
--     (user_id, goal)
--     VALUES (1,'starting goal');

-- INSERT INTO tags 
--     (tag) VALUES ('health'),('fitness'),('career'),('mental'),('spiritual'),('relationship'),('skill'),('music');

-- INSERT INTO goal_tags (goal_id, tag_id) VALUES (1,1),(1,2),(1,3);

-- INSERT INTO am (goal_id,day, gratitude_am, big_goal, task1, task2,task3) 
--     VALUES (1, 1,'good sleep', 'starting goal', 'one','2','3');

-- INSERT INTO pm (goal_id, day, gratitude_pm, obstacle1, solution1, discipline, overall_day, reflect)
--     VALUES (1,1,'good day','kid','get stuff done first', 5,5,'I think it was a good day, got fun things to do that were not goal related');

-- INSERT INTO tendays (goal_id,day,progress, win1, win2, win3, win_plan1, bad1, bad2, bad3, solution1,microgoal)
--     VALUES (1, 10, true, 'good week','new ideas', 'more creativity', 'meet one new person', 'slept in','stayed out late', 'too much prime rib', 'sleep by 10', 'make a goal');

-- INSERT INTO pm (goal_id, day, gratitude, obstacle1, solution1, discipline, overall_day, progress,reflect)
--     VALUES (5,11,'sunshine day','cat','get stuff done first', 3,7,true,'I think it was a good day, got fun things to do that were not goal related');

-- CREATE TABLE experiment
-- (
--      id SERIAL PRIMARY KEY,
--     datenum INTEGER,
--     words TEXT
-- );

-- INSERT INTO experiment (datenum, words)
--     VALUES (0, 'one'), (01, 'one'), (10, 'one'), (1, 'one'), (2, 'one'), (100, 'one');