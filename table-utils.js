const Table = require('easy-table');
const moment = require('moment');

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

};
