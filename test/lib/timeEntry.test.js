import { expect } from 'chai';
import { stub, spy } from 'sinon';
import { format, parse, subDays, subHours, setMilliseconds, setSeconds } from 'date-fns';

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
      validations.validateMinutes.withArgs(-1).returns('Time may not be negative.');
      expect(() => timeEntry.getEntryMinutes({ time: '-1' }))
        .to.throw();
    });
    it('reports the validation message in the error', () => {
      validations.validateMinutes.withArgs(-1).returns('Time may not be negative.');
      expect(() => timeEntry.getEntryMinutes({ time: '-1' }))
        .to.throw('Time may not be negative.');
    });
    it('returns an integer equal to the passed in time', () => {
      validations.validateMinutes.withArgs(123).returns(true);
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
      it.skip('backs up from the present time when the backTime parameter is passed', () => {
      });
      it('throws an exception if both logTime and backTime are used', () => {
        expect(() => timeEntry.getInsertTime({ logTime: '5:23 am', backTime: 20 }, { insertTime }))
          .to.throw();
      });
      it.skip('throws an exception backTime is invalid', () => {
      });
    });
    describe('when logTime is set', () => {
      it('should use the time', () => {
        const logTime = setSeconds(setMilliseconds(subHours(insertTime, 2), 0), 0);
        validations.validateTime.returns(true);
        const result = timeEntry.getInsertTime({ logTime: format(logTime, 'h:mm a') }, { insertTime });
        expect(result).to.be.a('Date');
        expect(result.toISOString()).to.equal(logTime.toISOString());
      });
      it.skip('throws an exception if logTime does not parse', () => {
      });
      it.skip('should always use the entry\'s date even when setting time on a different day', () => {
      });
    });
    describe('when neither is set', () => {
      it('should use the insert time on the entry', () => {
        const insertTime = new Date();
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
});
