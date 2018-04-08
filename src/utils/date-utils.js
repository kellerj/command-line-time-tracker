// import debug from 'debug';
// import parseTime from 'parse-loose-time';
import {
  parse, startOfDay, isValid,
  startOfISOWeek, endOfISOWeek, subDays,
  subWeeks, subMonths, startOfMonth, endOfMonth, isAfter,
} from 'date-fns';

module.exports = {

  /**
   * Parse (and adjust if needed) the given entry date.
   *
   * @param {string}    entryDateString      Description
   * @param {boolean}   [useYesterday=false] Description
   *
   * @returns {Date}
   */
  getEntryDate: (entryDateString, useYesterday = false) => {
    let entryDate = new Date();
    if (entryDateString) {
      entryDate = parse(entryDateString);
      if (!isValid(entryDate)) {
        throw new Error(`-d, --date: Invalid Date: ${entryDateString}`);
      }
    } else if (useYesterday) {
      entryDate = subDays(entryDate, 1);
    }
    return entryDate;
  },
};
