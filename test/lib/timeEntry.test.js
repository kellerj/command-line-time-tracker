import { expect } from 'chai';
import { jest } from '@jest/globals';
import {
  format, parseISO, subDays, subHours, addHours,
  subMinutes, setMilliseconds, setSeconds,
  getYear, setYear, getMonth, setMonth, getDate, setDate,
} from 'date-fns';

import * as Constants from '../../src/constants.js';

// Mock the db module before importing the module under test
const mockTimeEntryInsert = jest.fn();
const mockDb = {
  project: {
    insert: jest.fn(),
    getAll: jest.fn(),
    remove: jest.fn(),
  },
  timetype: {
    insert: jest.fn(),
    getAll: jest.fn(),
    remove: jest.fn(),
  },
  timeEntry: {
    insert: mockTimeEntryInsert,
    update: jest.fn(),
    get: jest.fn(),
    remove: jest.fn(),
    getMostRecentEntry: jest.fn(),
    summarizeByProjectAndTimeType: jest.fn(),
    setDebug: jest.fn(),
  },
};

jest.unstable_mockModule('../../src/db/index.js', () => ({
  default: mockDb,
}));

// Mock validations module for certain tests
const mockValidateMinutes = jest.fn();
const mockValidateTime = jest.fn();
jest.unstable_mockModule('../../src/utils/validations.js', () => ({
  default: {
    validateMinutes: mockValidateMinutes,
    validateTime: mockValidateTime,
    validateEntryDescription: jest.fn(),
    validateProjectName: jest.fn(),
    validateAndDefaultInputDateString: jest.fn(),
    getStartAndEndDates: jest.fn(),
  },
  validateMinutes: mockValidateMinutes,
  validateTime: mockValidateTime,
}));

// Import after setting up mocks
const timeEntry = await import('../../src/lib/timeEntry.js');

describe('lib/timeEntry', () => {
  describe('#getEntryDate', () => {
    describe('no "date" parameter', () => {
      it('returns today\'s date', () => {
        const result = timeEntry.getEntryDate({});
        expect(result).to.be.a('string');
        expect(result).to.equal(format(new Date(), Constants.DATE_FORMAT));
      });
      it('returns yesterday\'s date when --yesterday flag set', () => {
        const result = timeEntry.getEntryDate({ yesterday: true });
        expect(result).to.be.a('string');
        expect(result).to.equal(format(subDays(new Date(), 1), Constants.DATE_FORMAT));
      });
    });

    describe('"date" parameter given', () => {
      it('returns the given date if given as a parameter (string)', () => {
        const result = timeEntry.getEntryDate({ date: '2017-05-22' });
        expect(result).to.be.a('string');
        expect(result).to.equal('2017-05-22');
      });
      it('returns the given date if given as a parameter (date)', () => {
        const result = timeEntry.getEntryDate({ date: parseISO('2017-06-23') });
        expect(result).to.be.a('string');
        expect(result).to.equal('2017-06-23');
      });
      it('ignores the --yesterday parameter', () => {
        const result = timeEntry.getEntryDate({ date: '2017-05-22', yesterday: true });
        expect(result).to.be.a('string');
        expect(result).to.equal('2017-05-22');
      });
      it('throws an error if it can not parse the date', () => {
        expect(() => timeEntry.getEntryDate({ date: 'fdsfdsfds', yesterday: true })).to.throw('Invalid Date');
      });
    });
  });

  describe('#getEntryMinutes', () => {
    beforeEach(() => {
      mockValidateMinutes.mockReset();
    });

    it('returns null when no time parameter passed', () => {
      const result = timeEntry.getEntryMinutes({});
      // eslint-disable-next-line no-unused-expressions
      expect(result).to.be.null;
    });
    it('throws an error when the number does not validate.', () => {
      mockValidateMinutes.mockReturnValue('Time may not be negative.');
      expect(() => timeEntry.getEntryMinutes({ time: '-1' }))
        .to.throw();
    });
    it('reports the validation message in the error', () => {
      mockValidateMinutes.mockReturnValue('Time may not be negative.');
      expect(() => timeEntry.getEntryMinutes({ time: '-1' }))
        .to.throw('Time may not be negative.');
    });
    it('returns an integer equal to the passed in time', () => {
      mockValidateMinutes.mockReturnValue(true);
      const result = timeEntry.getEntryMinutes({ time: '123' });
      expect(result).to.be.a('number');
      expect(result).to.equal(123);
    });
  });

  describe('#getInsertTime', () => {
    const insertTime = new Date();
    const entryDate = format(insertTime, Constants.DATE_FORMAT);

    beforeEach(() => {
      mockValidateMinutes.mockReset();
      mockValidateTime.mockReset();
    });

    describe('when backTime is set', () => {
      it('backs up from the present time when the backTime parameter is passed', () => {
        mockValidateMinutes.mockReturnValue(true);
        const result = timeEntry.getInsertTime(
          { backTime: 20 },
          { insertTime, entryDate },
        );
        expect(result).to.be.a('Date');
        expect(result.toISOString()).to.equal(subMinutes(insertTime, 20).toISOString());
      });
      it('throws an exception if both logTime and backTime are used', () => {
        expect(() => timeEntry.getInsertTime(
          { logTime: '5:23 am', backTime: 20 },
          { insertTime, entryDate },
        )).to.throw();
      });
      it('throws an exception backTime is invalid', () => {
        mockValidateMinutes.mockReturnValue('Time may not be negative.');
        expect(() => timeEntry.getInsertTime(
          { backTime: -1 },
          { insertTime, entryDate },
        )).to.throw('Time may not be negative');
      });
    });
    describe('when logTime is set', () => {
      it('should use the time', () => {
        let logTime = setSeconds(setMilliseconds(subHours(insertTime, 2), 0), 0);
        logTime = setYear(logTime, getYear(insertTime));
        logTime = setMonth(logTime, getMonth(insertTime));
        logTime = setDate(logTime, getDate(insertTime));
        mockValidateTime.mockReturnValue(true);
        const result = timeEntry.getInsertTime(
          { logTime: format(logTime, 'h:mm a') },
          { insertTime, entryDate },
        );
        expect(result).to.be.a('Date');
        expect(result.toISOString()).to.equal(logTime.toISOString());
      });
      it('throws an exception if logTime does not parse', () => {
        mockValidateTime.mockReturnValue('Something is wrong with the date');
        expect(() => timeEntry.getInsertTime({ logTime: 'I\'m not a date!' }, { insertTime }))
          .to.throw('Something is wrong with the date');
      });
      it('should always use the entry\'s date even when setting time on a different day', () => {
        const yesterdayDate = subDays(insertTime, 1);
        const yesterday = format(yesterdayDate, Constants.DATE_FORMAT);
        let logTime = setSeconds(setMilliseconds(subHours(insertTime, 2), 0), 0);
        logTime = setYear(logTime, getYear(insertTime));
        logTime = setMonth(logTime, getMonth(insertTime));
        logTime = setDate(logTime, getDate(insertTime));
        mockValidateTime.mockReturnValue(true);
        const result = timeEntry.getInsertTime(
          { logTime: format(logTime, 'h:mm a') },
          { insertTime, entryDate: yesterday },
        );
        expect(result).to.be.a('Date');
        expect(format(result, Constants.DATE_FORMAT)).to.equal(yesterday);
      });
    });
    describe('when neither is set', () => {
      it('should use the insert time on the entry', () => {
        const result = timeEntry.getInsertTime({}, { insertTime, entryDate });
        expect(result).to.be.a('Date');
        expect(() => result.toISOString(), `unable to output date date: ${result}`).to.not.throw();
        expect(result.toISOString()).to.equal(insertTime.toISOString());
      });
    });
  });

  describe('#addTimeEntry', () => {
    let stdoutWriteSpy;

    beforeEach(() => {
      mockTimeEntryInsert.mockReset();
      stdoutWriteSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    });

    afterEach(() => {
      stdoutWriteSpy.mockRestore();
    });

    it('returns true with a summary message when insert succeeds', async () => {
      mockTimeEntryInsert.mockReturnValue(true);
      const result = await timeEntry.addTimeEntry({ entryDescription: 'testValue' });
      expect(result).to.be.true; // eslint-disable-line no-unused-expressions
      expect(stdoutWriteSpy.mock.calls[0][0]).to.match(/.*Time Entry.*added.*/);
      expect(stdoutWriteSpy.mock.calls[0][0]).to.match(/.*testValue.*/);
    });
    it('returns false with a summary message when insert fails', async () => {
      mockTimeEntryInsert.mockReturnValue(false);
      const result = await timeEntry.addTimeEntry({ entryDescription: 'testValue' });
      expect(result).to.be.false; // eslint-disable-line no-unused-expressions
      expect(stdoutWriteSpy.mock.calls[0][0]).to.match(/.*Failed.*/);
      expect(stdoutWriteSpy.mock.calls[0][0]).to.match(/.*testValue.*/);
    });
    it('returns false and does not blow up when null object passed', async () => {
      mockTimeEntryInsert.mockReturnValue(false);
      const result = await timeEntry.addTimeEntry(null);
      expect(result).to.be.false; // eslint-disable-line no-unused-expressions
      expect(stdoutWriteSpy.mock.calls[0][0]).to.match(/.*Failed.*/);
    });
  });

  describe('#getTimeType', () => {
    const validTimeTypes = ['TimeType1', 'AnotherOne', 'YetAnother'];
    it('returns a valid time type when passed in', () => {
      const result = timeEntry.getTimeType({ timeType: 'AnotherOne' }, validTimeTypes);
      expect(result).to.equal('AnotherOne');
    });
    it('valid time type checks should be case insensitive but return the value as from the time type table', () => {
      const result = timeEntry.getTimeType({ timeType: 'YETANOTHER' }, validTimeTypes);
      expect(result).to.equal('YetAnother');
    });
    it('return null when passed in an invalid timeType', () => {
      const result = timeEntry.getTimeType({ timeType: 'NotATimeType' }, validTimeTypes);
      expect(result).to.be.null; // eslint-disable-line no-unused-expressions
    });
    it('if a time type exists in the entry description, then use it', () => {
      let result = timeEntry.getTimeType({ entryDescription: 'Working on AnotherOne' }, validTimeTypes);
      expect(result).to.equal('AnotherOne', 'Should have detected AnotherOne at the end of the string');

      result = timeEntry.getTimeType({ entryDescription: 'Working on AnotherOne and YetAnother' }, validTimeTypes);
      expect(result).to.equal('AnotherOne', 'Should have detected AnotherOne within the string');

      result = timeEntry.getTimeType({ entryDescription: 'AnotherOne bites the dust' }, validTimeTypes);
      expect(result).to.equal('AnotherOne', 'Should have detected AnotherOne at the start of the string');
    });
    it('if no time type exists in the entry description, return null', () => {
      const result = timeEntry.getTimeType({ entryDescription: 'There is no time type in this description.' }, validTimeTypes);
      expect(result).to.be.null; // eslint-disable-line no-unused-expressions
    });
  });

  describe('#getProjectName', () => {
    const validProjects = ['Project1', 'AnotherOne', 'YetAnother'];
    it('returns a valid project when passed in', () => {
      const result = timeEntry.getProjectName({ project: 'AnotherOne' }, validProjects);
      expect(result).to.equal('AnotherOne');
    });
    it('valid project checks should be case insensitive but return the value as from the project table', () => {
      const result = timeEntry.getProjectName({ project: 'YETANOTHER' }, validProjects);
      expect(result).to.equal('YetAnother');
    });
    it('return null when passed in an invalid projectName', () => {
      const result = timeEntry.getProjectName({ project: 'NotATimeType' }, validProjects);
      expect(result).to.be.null; // eslint-disable-line no-unused-expressions
    });
    it('if a project exists in the entry description, then use it', () => {
      let result = timeEntry.getProjectName({ entryDescription: 'Working on AnotherOne' }, validProjects);
      expect(result).to.equal('AnotherOne', 'Should have detected AnotherOne at the end of the string');

      result = timeEntry.getProjectName({ entryDescription: 'Working on AnotherOne and YetAnother' }, validProjects);
      expect(result).to.equal('AnotherOne', 'Should have detected AnotherOne within the string');

      result = timeEntry.getProjectName({ entryDescription: 'AnotherOne bites the dust' }, validProjects);
      expect(result).to.equal('AnotherOne', 'Should have detected AnotherOne at the start of the string');
    });
    it('if no project exists in the entry description, return null', () => {
      const result = timeEntry.getProjectName({ entryDescription: 'There is no time type in this description.' }, validProjects);
      expect(result).to.be.null; // eslint-disable-line no-unused-expressions
    });
  });
  describe('#getMinutesSinceLastEntry', () => {
    it('returns the default time when no prior entry is found', () => {
      const result = timeEntry.getMinutesSinceLastEntry({}, null);
      expect(result).to.equal(Constants.DEFAULT_MINUTES);
    });
    it('returns the default time when the prior entry is not on the same day', () => {
      const result = timeEntry.getMinutesSinceLastEntry(
        { entryDate: '2017-11-11' },
        { entryDate: '2017-11-10' },
      );
      expect(result).to.equal(Constants.DEFAULT_MINUTES);
    });
    it('returns zero when the given most recent entry is in the future', () => {
      const result = timeEntry.getMinutesSinceLastEntry(
        { entryDate: '2017-11-11', insertTime: new Date() },
        { entryDate: '2017-11-11', insertTime: addHours(new Date(), 1) },
      );
      expect(result).to.equal(0);
    });
    it('returns the difference in minutes between the insert time of the new record and the old record', () => {
      const currTime = new Date();
      const result = timeEntry.getMinutesSinceLastEntry(
        { entryDate: '2017-11-11', insertTime: currTime },
        { entryDate: '2017-11-11', insertTime: subMinutes(currTime, 120) },
      );
      expect(result).to.equal(120);
    });
  });
});
