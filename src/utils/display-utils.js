import Table from 'easy-table';
import moment from 'moment'; // TODO: Convert to use date-fns
const sprintf = require('sprintf-js').sprintf;

module.exports = {

  // eslint-disable-next-line no-unused-vars
  entryDatePrinter: (val, width) => {
    const str = moment(val).format('ddd, MMM Do');
    return str;
  },

  // eslint-disable-next-line no-unused-vars
  insertTimePrinter: (val, width) => {
    const str = moment(val).format('h:mm a');
    return str;
  },

  timePrinter: (val, width) => {
    const duration = moment.duration(val, 'minutes');
    let str = '';
    if (duration.asHours() >= 1) {
      str += `${Math.floor(duration.asHours())}h `;
    }
    if (duration.minutes()) {
      str += Table.padLeft(`${duration.minutes()}m`, 3);
    } else {
      str += '   ';
    }
    return width ? Table.padLeft(str, width) : str;
  },

  // this method returns a printer function for easy-table
  // after incorporating the total time into the function
  // so it can display percents
  timeAndPercentPrinter: totalTime => (val, width) => {
    const duration = moment.duration(val, 'minutes');
    let str = '';
    if (duration.asHours() >= 1) {
      str += `${Math.floor(duration.asHours())}h `;
    }
    if (duration.minutes()) {
      str += Table.padLeft(`${duration.minutes()}m`, 3);
    } else {
      str += '   ';
    }
    str = `(${Math.round(100 * (val / totalTime), 0)}%) ${str}`;
    return width ? Table.padLeft(str, width) : str;
  },

  formatEntryChoice: entry => sprintf('%-8.8s : %-20.20s : %4i : %-15.15s : %-15.15s',
    moment(entry.insertTime).format('h:mm a'),
    entry.entryDescription,
    entry.minutes,
    entry.project,
    entry.timeType),

  // Utility to sort Other into the last position in an array
  // Special function to also detect if there is a 'project'
  // property on the object to allow objects containing that property
  // to be sorted as well
  sortOtherLast: (a, b) => {
    let left = a;
    let right = b;
    if (left.project || right.project) {
      left = left.project;
      right = right.project;
    }
    if (left !== 'Other' && right === 'Other') {
      return -1;
    } else if (left === 'Other' && right !== 'Other') {
      return 1;
    }
    return left.localeCompare(right);
  },

  autocompleteListSearch: (list, input, defaultValue) => new Promise((resolve) => {
    let searchString = input;
    // if we have detected that we have a project name, either from defaulting or command line
    // and the user has not entered any input yet, use that as the search string
    // to make it the only option
    if (defaultValue && (!searchString || !searchString.trim())) {
      searchString = defaultValue;
    }
    resolve(list.filter(
      e => !searchString || (typeof e === 'string' && e.toUpperCase().startsWith(searchString.toUpperCase().trim()))));
  }),

};
