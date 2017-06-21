const moment = require('moment');
const chalk = require('chalk');
const debug = require('debug')('tt:validations');

function validateAndDefaultInputDateString(dateString) {
  if (!dateString) {
    return moment().startOf('day');
  }
  if (!moment(dateString, 'YYYY-MM-DD').isValid()) {
    console.log(chalk.red(`Date ${dateString} is not a valid date.`));
    process.exit(-1);
  }
  return moment(dateString).startOf('day');
}

module.exports = {

  validateMinutes: (val) => {
    if (Number.isNaN(Number.parseInt(val, 10))) {
      return 'Invalid Integer';
    } else if (Number.parseInt(val, 10) < 1) {
      return 'Time must be positive';
    } else if (Number.parseInt(val, 10) > 8 * 60) {
      return 'Time must be <= 8 hours';
    }
    return true;
  },

  validateEntryDescription: (input) => {
    if (!input) {
      return 'description is required';
    }
    return true;
  },

  validateProjectName: (input) => {
    if (!input) {
      return 'project name is required';
    }
    return true;
  },

  validateAndDefaultInputDateString,

  getStartAndEndDates: (input) => {
    // Initialize to string values: will be converted to date objects later
    let entryDate = input.date;
    let startDate = input.startDate;
    let endDate = input.endDate;

    if (input.week || input.month) {
      const reportDate = moment();
      if (input.week) {
        if (input.last) {
          reportDate.subtract(1, 'week');
        }
        debug(`Setting to week containing: ${reportDate}`);
        startDate = moment(reportDate.startOf('isoWeek'));
        endDate = moment(reportDate.endOf('isoWeek'));
      } else if (input.month) {
        if (input.last) {
          reportDate.subtract(1, 'month');
        }
        debug(`Setting to month containing: ${reportDate}`);
        startDate = moment(reportDate.startOf('month'));
        endDate = moment(reportDate.endOf('month'));
      }
    }

    // if not set, use today.  In either case set to start of day
    if (entryDate || (!startDate && !endDate)) {
      entryDate = validateAndDefaultInputDateString(entryDate);
      if (input.last) {
        entryDate.subtract(1, 'day');
      }
      debug(`Start and end date not set, using entryDate: ${entryDate}`);
      startDate = entryDate;
      endDate = entryDate;
    } else {
      debug(`Using start and end dates: ${startDate} -- ${endDate}`);
      // we have a start date and/or end date
      startDate = validateAndDefaultInputDateString(startDate);
      endDate = validateAndDefaultInputDateString(endDate);
      if (startDate.isAfter(endDate)) {
        debug(`${startDate} is after ${endDate}`);
        startDate = endDate;
      }
    }
    // done with the moment objects - convert to dates for later use
    startDate = startDate.toDate();
    endDate = endDate.toDate();

    return { startDate, endDate };
  },
};
