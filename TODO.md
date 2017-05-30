# TODOs

## Phase 1

- [x] Get Mongo Connection Included
- [x] Project Management
    - [x] Add
        - [x] Disallow insert of duplicate (case insensitive?)
        - [x] Change command line to use all remaining words as a single project name
    - [x] List
    - [x] Remove
        - [x] Display list of projects for selection
        - [x] handle name list if given on command line
        - [x] output results of deletion
        - [x] Change command line to use all remaining words as a single project name
        - [x] Add confirmation question before remove
        - [x] Skip confirmation if no projects marked for removal
- [x] Time Type
    - [x] Command base file
    - [x] Add
    - [x] List
    - [x] Remove
        - [x] Add confirmation question before remove
        - [x] Skip confirmation if no projects marked for removal
- [x] Other Data Elements
    - [x] Waste (bool/checkbox)
    - [x] Dates
    - [x] Time
- [ ] Time entries
    - [x] Add
        - [x] Full Command Line
            - [x] Parse parameters
            - [x] Validate parameters
            - [x] Default parameters and skip questions for those on command line
        - [x] UI
            - [x] List of projects
            - [x] List of time types
            - [x] Data entry for other elements
                - [x] Amount of Time
                    - [x] Numeric Validation
                    - [x] Range validation (> 0, <= 8 hours)
                - [x] WasUseless (boolean)
        - [x] Compute # minutes since last entry added as default for time
            - [x] Add API method to get last time entry for today
            - [x] Compute # minutes (using moment) since then
            - [x] Default to 60 min if no record found today
            - [x] Don't attempt the calculation if the entry date has been set manually
        - [x] Add control data (times)
        - [x] save item to database
        - [x] Add a bottom bar with current minutes derived from last entry
        - [x] Allow addition of new project
            - [x] add a separator bar
            - [x] option for new project
            - [x] Asking of question for project name
            - [x] saving of project name
            - [x] setting in answer array
    - [x] List
        - [x] Defaulting Today
        - [x] Date Parameter Support
        - [x] Format (table): Entry Date : Insert Time, Project, Type, Time, Description
        - [x] Add emoji column for waste of time Entries
        - [x] Add option to suppress the date output
    - [x] Edit
        - [x] Date parameter (optional - default to today)
        - [x] parameter --last to auto-edit the most recent entry
        - [x] Display List to use as selection for the given date
        - [x] Enter the Edit screen with defaults from existing record
            - [x] See if there is a way to re-use the inquirer settings from the add function
        - [x] Perform the DB update - don't alter the insert time
    - [x] Remove
        - [x] Display List as radio selection
        - [x] delete those selected upon confirm
        - [x] Add --last option for deletions - but include confirmation
    - [x] Summaries
        - [x] Heading indicating the nature of the summary and the timeframe
        - [x] sort of project names - perform in MongoDB
        - [x] Sort list of time types for display
        - [x] sort "Other" project to end
        - [x] Total by Time Type
        - [x] Total by Project
        - [x] Grid...projects down side, time types as columns - totals right and bottom
        - [x] default report for today
        - [x] --week
        - [x] --month
        - [x] --last
        - [x] -s --startDate, -e --endDate
        - [x] Add percentage to time type totals on main grid
- [x] Determine how to do colored table-based output
- [x] Add "binaries" for all sub-commands
    - [x] Time Entry
    - [x] Project
    - [x] Time Type
    - [x] Summary
- [x] Add ESLint to project
- [x] rename remove to delete
- [x] See if sub-commands can be aliased
- [x] Entry edit and remove lists - increase display size
- [x] Fix name of tt-remove
- [x] Update color of last entry logged message
- [x] Move time for entry to just after description entry
- [x] Add Readme
    - [x] install info
    - [x] commands
    - [x] purpose
    - [x] requirements
        - [x] mongo
- [x] Reduce to only make a single connection: maxPoolSize

## Roadmap

### 1.1

- [ ] Reports
    - [ ] Daily Summary in Markdown format
        - [ ] Group by project as level 3 headings
        - [ ] include total time for project
        - [ ] summary of time types for the day

### 1.2

- [ ] On entry add - check for name of project in description and set as default
- [ ] On entry add - check for name of time type in description and set as default

### 1.3

- [ ] Add CL option to back-date the insert time entry on add
- [ ] Add ability to edit the logged time on an entry

### 2.0

- [ ] Entry List
    - [ ] Date Range Support
    - [ ] CSV format option
    - [ ] project criteria option
    - [ ] max description length option
    - [ ] Eliminate extra column when no wasted time entries on a day
- [ ] Add sort order to time types
    - [ ] Database update
    - [ ] new UI questions
    - [ ] use of sort flag...how - no DB joins - need to sort in code
- [ ] Make "Other" project special (not in DB) and always sort at end
- [ ] support --last option on list
- [ ] support --last option on summary when no modifier given to display for yesterday

### 3.0

- [ ] Add function to log break time - hidden from lists unless option given - use on getting last minute count
    - [ ] Use different column for minutes to preserve existing code
- [ ] Time Type Categories (Communication, Team Support, Design/Development)
    - [ ] Add
    - [ ] ls
    - [ ] Remove
    - [ ] Assign
        - [ ] Display list of all time types with pre-selected radio buttons
    - [ ] Use of the categories on report/summary (TBD)
- [ ] Notes functionality on time Entries
    - [ ] --note option on add to tell system that we want to include a note
    - [ ] editor style prompt for the note
    - [ ] --notes on list command to show notes
    - [ ] column on normal list display to indicate existence of note
    - [ ] second row for display of notes?

### Future

- [ ] Switch implementations to the observable pattern??
- [ ] Additional parameter to change the MongoDB database used for commands
- [ ] Export Function
    - [ ] JSON
    - [ ] CSV?
- [ ] Project Maintenance
    - [ ] Rename
        - [ ] Display list of projects for selection
        - [ ] Allow entry of new name
        - [ ] Command line old name / new name parameters
- [ ] Find place to report on "wasted time"
- [ ] Add explicit support for MongoDB credentials
