import moment from 'moment';
// TODO: Convert to use date-fns
import { sprintf } from 'sprintf-js';

module.exports = {

  // eslint-disable-next-line no-unused-vars
  datePrinter: (val, width) => {
    const str = moment(val).format('ddd, MMM Do');
    return str;
  },

  // eslint-disable-next-line no-unused-vars
  timePrinter: (val, width) => {
    const str = moment(val).format('h:mm a');
    return str;
  },

  durationPrinter: (val, width) => {
    const duration = moment.duration(val, 'minutes');
    let str = '';
    if (duration.asHours() >= 1) {
      str += `${Math.floor(duration.asHours())}h `;
    }
    if (duration.minutes()) {
      str += `${duration.minutes()}m`.padStart(3);
    } else {
      str += '   ';
    }
    // TODO: remove return of width when easy-table fully removed
    return width ? str.padStart(width) : str;
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
      str += `${duration.minutes()}m`.padStart(3);
    } else {
      str += '   ';
    }
    str = `(${Math.round(100 * (val / totalTime), 0)}%) ${str}`;
    // TODO: remove return of width when easy-table fully removed
    return width ? str.padStart(width) : str;
  },

  formatEntryChoice: entry => sprintf(
    '%-8.8s : %-20.20s : %4i : %-15.15s : %-15.15s',
    moment(entry.insertTime).format('h:mm a'),
    entry.entryDescription,
    entry.minutes,
    entry.project,
    entry.timeType,
  ),

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
    } else if (left.Project || right.Project) {
      left = left.Project;
      right = right.Project;
    }
    if (left !== 'Other' && right === 'Other') {
      return -1;
    } else if (left === 'Other' && right !== 'Other') {
      return 1;
    }
    if (!left) {
      left = '';
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
    resolve(list.filter(e => !searchString || (typeof e === 'string' && e.toUpperCase().startsWith(searchString.toUpperCase().trim()))));
  }),

};
