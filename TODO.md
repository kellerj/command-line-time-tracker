# TODOs

## Phase 1

- [x] Get Mongo Connection Included
- [ ] Project Management
    - [x] Add
        - [x] Disallow insert of duplicate (case insensitive?)
        - [x] Change command line to use all remaining words as a single project name
    - [x] List
    - [ ] Remove
        - [x] Display list of projects for selection
        - [x] handle name list if given on command line
        - [x] output results of deletion
        - [x] Change command line to use all remaining words as a single project name
        - [ ] Add confirmation question before remove
- [ ] Time Type
    - [x] Command base file
    - [x] Add
    - [x] List
    - [ ] Remove
        - [ ] Add confirmation question before remove
- [ ] Other Data Elements
    - [ ] Waste (bool/checkbox)
    - [ ] Dates
    - [ ] Time
    - [ ] Notes
- [ ] Time entries
    - [ ] Add
        - [ ] Full Command Line ??
        - [ ] UI
            - [x] List of projects
            - [x] List of time types
            - [x] Data entry for other elements
                - [x] Amount of Time
                    - [x] Numeric Validation
                    - [x] Range validation (> 0, <= 8 hours)
                - [x] WasUseless (boolean)
        - [ ] Compute # minutes since last entry added as default for time
        - [ ] Add control data (times)
        - [ ] save item to database
    - [ ] List
        - [ ] Defaulting Today
        - [ ] Date Parameter Support
        - [ ] Date Range Support
    - [ ] Edit
        - [ ] Display List
        - [ ] Enter the Edit screen with defaults from existing record
    - [ ] Remove
        - [ ] Display List as radio selection
        - [ ] delete those selected upon confirm
    - [ ] Summaries
        - [ ] Total by Time Type
        - [ ] Total by Project
        - [ ] Grid...time type and project?
- [x] Determine how to do colored table-based output
- [ ] Add "binaries" for all sub-commands
- [x] Add ESLint to project


## Phase 2

- [ ] Export Function
    - [ ] JSON
    - [ ] CSV?
- [ ] Project Maintenance
    - [ ] Rename
        - [ ] Display list of projects for selection
        - [ ] Allow entry of new name
        - [ ] Command line old name / new name parameters
- [ ] Time Type Categories
    - [ ] Add
    - [ ] ls
    - [ ] Remove
    - [ ] Assign
        - [ ] Display list of all time types with pre-selected radio buttons
