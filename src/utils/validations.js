// import moment from 'moment';
import debug from 'debug';
import parseTime from 'parse-loose-time';
import {
  parseISO, startOfDay, isValid,
  startOfISOWeek, endOfISOWeek, subDays,
  subWeeks, subMonths, startOfMonth, endOfMonth, isAfter,
} from 'date-fns';

const LOG = debug('tt:validations');

function validateAndDefaultInputDateString(dateString) {
  if (!dateString) {
    return startOfDay(new Date());
  }
  const parsedDate = parseISO(dateString);
  if (!isValid(parsedDate)) {
    return `Date ${dateString} is not a valid date.`;
  }
  return startOfDay(parsedDate);
}

module.exports = {

  validateMinutes: (val, maxMinutes = 480) => {
    if (Number.isNaN(Number.parseInt(val, 10))) {
      return 'Invalid Integer';
    } if (Number.parseInt(val, 10) < 1) {
      return 'Time must be positive';
    } if (maxMinutes !== -1 && Number.parseInt(val, 10) > maxMinutes) {
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
    const parsedTime = parseTime(input);
    if (!parsedTime) {
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
      let reportDate = validateAndDefaultInputDateString(entryDate);
      if (input.week) {
        if (input.last) {
          reportDate = subWeeks(reportDate, 1);
        }
        LOG('Setting to week containing: %s', reportDate);
        startDate = startOfISOWeek(reportDate);
        endDate = endOfISOWeek(reportDate);
      } else { // input.month == true
        if (input.last) {
          reportDate = subMonths(reportDate, 1);
        }
        LOG('Setting to month containing: %s', reportDate);
        startDate = startOfMonth(reportDate);
        endDate = endOfMonth(reportDate);
      }
      // if not set, use today.  In either case set to start of day
    } else if (entryDate || (!startDate && !endDate)) {
      entryDate = validateAndDefaultInputDateString(entryDate);
      if (typeof entryDate === 'string') {
        return { startDate: undefined, endDate: undefined, errorMessage: entryDate };
      }
      if (input.last || input.yesterday) {
        entryDate = subDays(entryDate, 1);
      }
      LOG('Start and end date not set, using entryDate: %s', entryDate);
      startDate = entryDate;
      endDate = entryDate;
    } else { // we have start and end dates - check those
      LOG('Using start and end dates: %s -- %s', startDate, endDate);
      // we have a start date and/or end date
      startDate = validateAndDefaultInputDateString(startDate);
      if (typeof startDate === 'string') {
        return { startDate: undefined, endDate: undefined, errorMessage: startDate };
      }
      endDate = validateAndDefaultInputDateString(endDate);
      if (typeof endDate === 'string') {
        return { startDate: undefined, endDate: undefined, errorMessage: endDate };
      }
      if (isAfter(startDate, endDate)) {
        LOG('%s is after %s, setting startDate to the endDate', startDate, endDate);
        startDate = endDate;
      }
    }
    // Eliminate any time components from the dates
    startDate = startOfDay(startDate);
    endDate = startOfDay(endDate);

    return { startDate, endDate, errorMessage };
  },
};
