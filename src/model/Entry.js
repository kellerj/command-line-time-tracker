/**
 * Represents an entry in the time log.
 * @class Entry
 */
class Entry {
  /**
   * Create an Entry.
   *
   * @constructs
   * @param {module:tt-add.AddCommandArguments} args - Argument object to Initialize object with.
   */
  constructor(args) {
    /** description of the time entry
     * @type {string}
     */
    this.entryDescription = args.description;
    /** name of the project this entry is associated with
     * @type {string}
     */
    this.project = args.project;
    /** type of activity this entry represents
     * @type {string}
     */
    this.timeType = args.type;
    /** length of the activity
     * @type {number}
     */
    this.minutes = args.time;
    /** end time of the activity
     * @type {Date}
     */
    this.insertTime = new Date();
    /** date of the activity in string YYYY-MM-DD format
     * @type {string}
     */
    this.entryDate = args.date;
    /** was this a good use of time?
     * @type {boolean}
     */
    this.wasteOfTime = args.wasteOfTime || false;
  }

  // TODO: Add a natural toString to the object
  // TODO: Add the list format as a standard method of viewing the object
  // TODO: Reformat the entry date on the record?
}

module.exports = Entry;
