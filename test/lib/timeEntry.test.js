import { expect } from 'chai';
import { stub, spy } from 'sinon';
import { format, parse, subDays, subHours,
  subMinutes, setMilliseconds, setSeconds,
  getYear, setYear, getMonth, setMonth, getDate, setDate } from 'date-fns';

import { DATE_FORMAT } from '../../src/constants';
import * as timeEntry from '../../src/lib/timeEntry';
import validations from '../../src/utils/validations';
import db from '../../src/db';

console.log(DATE_FORMAT);

context('lib/timeEntry', () => {
  describe('#getEntryDate', () => {
    describe('no "date" parameter', () => {
      it('returns today\'s date', () => {
        const result = timeEntry.getEntryDate({});
        expect(result).to.be.a('string');
        expect(result).to.equal(format(new Date(), DATE_FORMAT));
      });
      it('returns yesterday\'s date when --yesterday flag set', () => {
        const result = timeEntry.getEntryDate({ yesterday: true });
        expect(result).to.be.a('string');
        expect(result).to.equal(format(subDays(new Date(), 1), DATE_FORMAT));
      });
    });

    describe('"date" parameter given', () => {
      it('returns the given date if given as a parameter (string)', () => {
        const result = timeEntry.getEntryDate({ date: '2017-5-22' });
        expect(result).to.be.a('string');
        expect(result).to.equal('2017-05-22');
      });
      it('returns the given date if given as a parameter (date)', () => {
        const result = timeEntry.getEntryDate({ date: parse('2017-06-23') });
        expect(result).to.be.a('string');
        expect(result).to.equal('2017-06-23');
      });
      it('ignores the --yesterday parameter', () => {
        const result = timeEntry.getEntryDate({ date: '2017-05-22', yesterday: true });
        expect(result).to.be.a('string');
        expect(result).to.equal('2017-05-22');
      });
      it('throws an error if it can not parse the date', () => {
        expect(() => timeEntry.getEntryDate({ date: 'Jan 1, 2017', yesterday: true })).to.throw('Invalid Date');
      });
    });
  });

  describe('#getEntryMinutes', () => {
    beforeEach(() => {
      stub(validations, 'validateMinutes');
    });
    afterEach(() => {
      validations.validateMinutes.restore();
    });
    it('returns null when no time parameter passed', () => {
      const result = timeEntry.getEntryMinutes({});
      // eslint-disable-next-line no-unused-expressions
      expect(result).to.be.null;
    });
    it('throws an error when the number does not validate.', () => {
      validations.validateMinutes.returns('Time may not be negative.');
      expect(() => timeEntry.getEntryMinutes({ time: '-1' }))
        .to.throw();
    });
    it('reports the validation message in the error', () => {
      validations.validateMinutes.returns('Time may not be negative.');
      expect(() => timeEntry.getEntryMinutes({ time: '-1' }))
        .to.throw('Time may not be negative.');
    });
    it('returns an integer equal to the passed in time', () => {
      validations.validateMinutes.returns(true);
      const result = timeEntry.getEntryMinutes({ time: '123' });
      expect(result).to.be.a('number');
      expect(result).to.equal(123);
    });
  });

  describe('#getInsertTime', () => {
    const insertTime = new Date();
    beforeEach(() => {
      stub(validations, 'validateMinutes');
      stub(validations, 'validateTime');
    });
    afterEach(() => {
      validations.validateMinutes.restore();
      validations.validateTime.restore();
    });
    describe('when backTime is set', () => {
      it('backs up from the present time when the backTime parameter is passed', () => {
        validations.validateMinutes.returns(true);
        const result = timeEntry.getInsertTime({ backTime: 20 }, { insertTime });
        expect(result).to.be.a('Date');
        expect(result.toISOString()).to.equal(subMinutes(insertTime, 20).toISOString());
      });
      it('throws an exception if both logTime and backTime are used', () => {
        expect(() => timeEntry.getInsertTime({ logTime: '5:23 am', backTime: 20 }, { insertTime }))
          .to.throw();
      });
      it('throws an exception backTime is invalid', () => {
        validations.validateMinutes.returns('Time may not be negative.');
        expect(() => timeEntry.getInsertTime({ backTime: -1 }, { insertTime }))
          .to.throw('Time may not be negative');
      });
    });
    describe('when logTime is set', () => {
      it('should use the time', () => {
        let logTime = setSeconds(setMilliseconds(subHours(insertTime, 2), 0), 0);
        logTime = setYear(logTime, getYear(insertTime));
        logTime = setMonth(logTime, getMonth(insertTime));
        logTime = setDate(logTime, getDate(insertTime));
        validations.validateTime.returns(true);
        const result = timeEntry.getInsertTime({ logTime: format(logTime, 'h:mm a') }, { insertTime });
        expect(result).to.be.a('Date');
        expect(result.toISOString()).to.equal(logTime.toISOString());
      });
      it('throws an exception if logTime does not parse', () => {
        validations.validateTime.returns('Something is wrong with the date');
        expect(() => timeEntry.getInsertTime({ logTime: 'I\'m not a date!' }, { insertTime }))
          .to.throw('Something is wrong with the date');
      });
      it('should always use the entry\'s date even when setting time on a different day', () => {
        const yesterday = format(subDays(insertTime, 1), DATE_FORMAT);
        let logTime = setSeconds(setMilliseconds(subHours(insertTime, 2), 0), 0);
        logTime = setYear(logTime, getYear(insertTime));
        logTime = setMonth(logTime, getMonth(insertTime));
        logTime = setDate(logTime, getDate(insertTime));
        validations.validateTime.returns(true);
        const result = timeEntry.getInsertTime(
          { logTime: format(logTime, 'h:mm a') },
          { insertTime, entryDate: yesterday },
        );
        expect(result).to.be.a('Date');
        expect(format(result, DATE_FORMAT)).to.equal(format(yesterday, DATE_FORMAT));
      });
    });
    describe('when neither is set', () => {
      it('should use the insert time on the entry', () => {
        const result = timeEntry.getInsertTime({}, { insertTime });
        expect(result).to.be.a('Date');
        expect(result.toISOString()).to.equal(insertTime.toISOString());
      });
    });
  });

  describe('#addTimeEntry', () => {
    beforeEach(() => {
      stub(db.timeEntry, 'insert');
      spy(console, 'log');
    });
    afterEach(() => {
      db.timeEntry.insert.restore();
      console.log.restore();
    });
    it('returns true with a summary message when insert succeeds', async () => {
      db.timeEntry.insert.returns(true);
      const result = await timeEntry.addTimeEntry({ entryDescription: 'testValue' });
      expect(result).to.be.true; // eslint-disable-line no-unused-expressions
      expect(console.log.getCall(0).args[0]).to.match(/.*Time Entry.*added.*/);
      expect(console.log.getCall(0).args[0], 'should have contained entry description').to.match(/.*testValue*/);
    });
    it('returns false with a summary message when insert fails', async () => {
      db.timeEntry.insert.returns(false);
      const result = await timeEntry.addTimeEntry({ entryDescription: 'testValue' });
      expect(result).to.be.false; // eslint-disable-line no-unused-expressions
      expect(console.log.getCall(0).args[0]).to.match(/.*Failed.*/);
      expect(console.log.getCall(0).args[0], 'should have contained entry description').to.match(/.*testValue*/);
    });
    it('returns false and does not blow up when null object passed', async () => {
      db.timeEntry.insert.returns(false);
      const result = await timeEntry.addTimeEntry(null);
      expect(result).to.be.false; // eslint-disable-line no-unused-expressions
      expect(console.log.getCall(0).args[0]).to.match(/.*Failed.*/);
    });
  });

  describe('#getTimeType', () => {
    const validTimeTypes = ['TimeType1', 'AnotherOne', 'YetAnother'];
    it('returns a valid time type when passed in', () => {
      const result = timeEntry.getTimeType({ timeType: 'AnotherOne' }, validTimeTypes);
      expect(result).to.equal('AnotherOne');
    });
    it('valid time type checks should be case insensitive but return the value as fro mthe time type table', () => {
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
});
