import { parseISO, subDays, isValid } from 'date-fns';
// import debug from 'debug';
// import parseTime from 'parse-loose-time';
// , startOfDay,
// startOfISOWeek, endOfISOWeek,
// subWeeks, subMonths, startOfMonth, endOfMonth, isAfter,

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
      entryDate = parseISO(entryDateString);
      if (!isValid(entryDate)) {
        throw new Error(`-d, --date: Invalid Date: ${entryDateString}`);
      }
      if (useYesterday) {
        throw new Error('-d (date) and -y (yesterday) options may not be used at the same time');
      }
    } else if (useYesterday) {
      entryDate = subDays(entryDate, 1);
    }
    return entryDate;
  },
};
