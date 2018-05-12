/**
 * Represents an entry in the time log.
 * @class Entry
 */
class Entry {
  /**
   * Create an Entry
   * @constructor
   * @param {any} args - argument object to Initialize object with
   */
  constructor(args) {
    /** @type {string} - description of the time entry */
    this.entryDescription = args.description;
    /** @type {string} - name of the project this entry is associated with */
    this.project = args.project;
    this.timeType = args.type;
    this.minutes = args.time;
    this.insertTime = new Date();
    this.entryDate = args.date;
    this.wasteOfTime = args.wasteOfTime || false;
  }
}

module.exports = Entry;
