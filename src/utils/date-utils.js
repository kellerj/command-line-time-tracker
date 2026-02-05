import { parseISO, subDays, isValid } from 'date-fns';

/**
 * Parse (and adjust if needed) the given entry date.
 *
 * @param {string}    entryDateString      Description
 * @param {boolean}   [useYesterday=false] Description
 *
 * @returns {Date}
 */
export function getEntryDate(entryDateString, useYesterday = false) {
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
}

export default {
  getEntryDate,
};
