const Table = require('easy-table');
const moment = require('moment');
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

  sortOtherLast: (a, b) => {
    if (a !== 'Other' && b === 'Other') {
      return -1;
    } else if (a === 'Other' && b !== 'Other') {
      return 1;
    }
    return a.localeCompare(b);
  },

};
