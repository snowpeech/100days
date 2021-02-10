# 100 Days Journal API

Deployed:
Front End GitHub: [https://github.com/snowpeech/100days-front](https://github.com/snowpeech/100days-front)

## Description
This is the back end to the 100 Days Journal, where users can create a goal and track 
their progress to reaching a big (100 day) goal. Users can check in every morning and night to fill 
out different prompts to encourage accountability and reflection.

## Features
The backend provides endpoints to create, update, and delete a user; create, update, and delete a goal; and 
create, update, and delete the three types of posts related to goals. It also provides endpoints to
fetch user information, goals, and posts related to a goal. 

The goals can be created and associated with tags, providing structure for a future feature of being able 
to browse other goals by tags. 

## Testing
Create a test database and update db.js (ln 6) with the name of your local test database.

Tests are located in the "__tests__" folder and can be run with `jest test` or to run an individual test, `jest testfilename`


## User Flow 
(for the front end)
To start, the user creates an account, filling out basic profile information. The user is guided 
towards creating their 100-day goal. Once the user has a goal saved, they can start filling out the 
journal with AM & PM posts under the Today link. Every tenth day from their start date, they are prompted to fill out 
a Ten Day Review post, either linked from their daily journal or the Ten Day Review link in the navbar.
The user can edit and delete their posts in the 


## Tech Stack
Built with NodeJS, Express, PostgreSQL, React, Bootstrap, axios, dayjs, nivo
