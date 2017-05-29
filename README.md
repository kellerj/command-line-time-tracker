# Command Line Time Tracker

This tool is a utility I created for my own purposes to keep track of how my time was being spent at work.  The use of Node and MongoDB is mainly due to current interest rather than being the appropriate technology for this type of application.

## Installing

In the project directory, just run:

    npm install
    npm link

to install the tools on your path.

## Requirements

* Node 6+
* MongoDB 3.2+

By default, the application expects you to have an unsecured MongoDB server running on your local workstation on the standard port.  It uses (again by default) the

## Usage

The main command of the set is `tt`.  All commands use [commander]() to handle command line arguments, and contain built in help.  Some sub-commands have default operations, in which case use the standard `--help` option to display usage information.

### Commands

| Command            | Description                      |
|:-------------------|:---------------------------------|
| tt add             | Add a time entry to the database |
| tt list            |                                  |
| tt delete          |                                  |
| tt edit            |                                  |
| tt summary         |                                  |
| tt project add     |                                  |
| tt project list    |                                  |
| tt project delete  |                                  |
| tt timetype add    |                                  |
| tt timetype list   |                                  |
| tt timetype delete |                                  |

## Database Structure

The application uses 3 collections to store all data.

* `projects` : Project names
* `timetype` : Types of times (e.g., meetings, development, email, etc...)
* `timeEntry` : Main data table with all logged time

### projects

TODO: describe structure

### timetype

TODO: describe structure

### timeEntry

TODO: describe structure
