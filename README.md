# Command Line Time Tracker

[![Build Status](https://travis-ci.org/kellerj/command-line-time-tracker.svg?branch=master)](https://travis-ci.org/kellerj/command-line-time-tracker) [![Coverage Status](https://coveralls.io/repos/github/kellerj/command-line-time-tracker/badge.svg?branch=master)](https://coveralls.io/github/kellerj/command-line-time-tracker?branch=master)

This tool is a utility I created for my own purposes to keep track of how my time was being spent at work.  The use of Node and MongoDB is mainly due to current interest rather than being the appropriate technology for this type of application.

It's intended to provide you a way to log your time throughout the day along with the project being worked on during that time and the type of time (meeting, development, email).  It then provides methods for summarizing the data to see how productive (or wasted) your day/week/month has been.

## Installing

In the project directory, just run:

    npm install
    npm link

to install the tools on your path.

## Requirements

* Node 6+
* MongoDB 3.2+

By default, the application expects you to have an unsecured MongoDB server running on your local workstation on the standard port.  It uses (again by default) the `tt` database on that instance.  If you need to change the connection information, the settings are in the `db/config.js` file.

## Usage

The main command of the set is `tt`.  All commands use [commander](https://www.npmjs.com/package/commander) to handle command line arguments, and contain built-in help.  Some sub-commands have default operations, in which case use the standard `--help` option to display usage information.

### Commands

| Command            | Description                                                     |
|:-------------------|:----------------------------------------------------------------|
| tt add             | Add a time entry to the database                                |
| tt list            | List time entries for a given day                               |
| tt delete          | Delete a previously entered time entry                          |
| tt edit            | Edit a previously entered time entry                            |
| tt summary         | Generate a tabular summary of time use by project and time type |
| tt project add     | Add a new project name                                          |
| tt project list    | list all existing project names                                 |
| tt project delete  | delete a project                                                |
| tt timetype add    | Add a new time type                                             |
| tt timetype list   | list all existing time types                                    |
| tt timetype delete | delete a time type                                              |

## Database Structure

The application uses 3 collections to store all data.

* `projects` : Project names
* `timetype` : Types of times (e.g., meetings, development, email, etc...)
* `timeEntry` : Main data table with all logged time

### Collection: `projects`

| Property | Data Type | Notes                     |
|:---------|:----------|:--------------------------|
| _id      | ObjectId  | Auto-Generated by MongoDB |
| name     | String    |                           |

### Collection: `timetype`

| Property | Data Type | Notes                     |
|:---------|:----------|:--------------------------|
| _id      | ObjectId  | Auto-Generated by MongoDB |
| name     | String    |                           |

### Collection: `timeEntry`

| Property         | Data Type | Notes                                                         |
|:-----------------|:----------|:--------------------------------------------------------------|
| _id              | ObjectId  | Auto-Generated by MongoDB                                     |
| entryDescription | String    |                                                               |
| project          | String    |                                                               |
| timeType         | String    |                                                               |
| minutes          | Integer   |                                                               |
| entryDate        | String    | In YYYY-MM-DD format to allow for non-date data type matching |
| insertTime       | Date      | Date record was added to the database                         |
| wasteOfTime      | boolean   | Because...sometimes is is                                     |
