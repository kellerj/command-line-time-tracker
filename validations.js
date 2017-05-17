const moment = require('moment');
const chalk = require('chalk');

module.exports = {

  validateMinutes: (val) => {
    if (Number.isNaN(val)) {
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

  validateAndDefaultInputDateString: (dateString) => {
    if (!dateString) {
      return moment().startOf('day');
    }
    if (!moment(dateString, 'YYYY-MM-DD').isValid()) {
      console.log(chalk.red(`Date ${dateString} is not a valid date.`));
      process.exit(-1);
    }
    return moment(dateString).startOf('day');
  },

};
