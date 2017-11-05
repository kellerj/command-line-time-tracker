import moment from 'moment';
// TODO: Convert to use date-fns
const LOG = require('debug')('tt:validations');

function validateAndDefaultInputDateString(dateString) {
  if (!dateString) {
    return moment().startOf('day');
  }
  if (!moment(dateString, 'YYYY-MM-DD').isValid()) {
    return `Date ${dateString} is not a valid date.`;
  }
  return moment(dateString).startOf('day');
}

module.exports = {

  validateMinutes: (val, maxMinutes = 480) => {
    if (Number.isNaN(Number.parseInt(val, 10))) {
      return 'Invalid Integer';
    } else if (Number.parseInt(val, 10) < 1) {
      return 'Time must be positive';
    } else if (maxMinutes !== -1 && Number.parseInt(val, 10) > maxMinutes) {
      return `Time must be <= ${maxMinutes / 60} hours`;
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

  validateTime: (input) => {
    // attempt to parse the time as 12-hour format then 24 hour
    const parsedTime = moment(input, 'h:mm a');
    if (!parsedTime.isValid()) {
      return `${input} is not a valid time, must be in h:mm am format.`;
    }
    return true;
  },

  validateAndDefaultInputDateString,

  getStartAndEndDates: (input) => {
    // Initialize to string values: will be converted to date objects later
    let { date: entryDate, startDate, endDate } = input;
    const errorMessage = '';

    if (input.week || input.month) {
      const reportDate = validateAndDefaultInputDateString(entryDate);
      if (input.week) {
        if (input.last) {
          reportDate.subtract(1, 'week');
        }
        LOG(`Setting to week containing: ${reportDate}`);
        startDate = moment(reportDate.startOf('isoWeek'));
        endDate = moment(reportDate.endOf('isoWeek'));
      } else { // input.month == true
        if (input.last) {
          reportDate.subtract(1, 'month');
        }
        LOG(`Setting to month containing: ${reportDate}`);
        startDate = moment(reportDate.startOf('month'));
        endDate = moment(reportDate.endOf('month'));
      }
      // if not set, use today.  In either case set to start of day
    } else if (entryDate || (!startDate && !endDate)) {
      entryDate = validateAndDefaultInputDateString(entryDate);
      if (typeof entryDate === 'string') {
        return { startDate: undefined, endDate: undefined, errorMessage: entryDate };
      }
      if (input.last || input.yesterday) {
        entryDate.subtract(1, 'day');
      }
      LOG(`Start and end date not set, using entryDate: ${entryDate}`);
      startDate = entryDate;
      endDate = entryDate;
    } else {
      LOG(`Using start and end dates: ${startDate} -- ${endDate}`);
      // we have a start date and/or end date
      startDate = validateAndDefaultInputDateString(startDate);
      if (typeof startDate === 'string') {
        return { startDate: undefined, endDate: undefined, errorMessage: startDate };
      }
      endDate = validateAndDefaultInputDateString(endDate);
      if (typeof endDate === 'string') {
        return { startDate: undefined, endDate: undefined, errorMessage: endDate };
      }
      if (startDate.isAfter(endDate)) {
        LOG(`${startDate} is after ${endDate}`);
        startDate = endDate;
      }
    }
    // done with the moment objects - convert to dates for later use
    startDate = startDate.startOf('day').toDate();
    endDate = endDate.startOf('day').toDate();

    return { startDate, endDate, errorMessage };
  },
};
