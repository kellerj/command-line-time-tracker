import { expect } from 'chai';
import { stub } from 'sinon';
import { format, parse } from 'date-fns';
import subDays from 'date-fns/sub_days';

import { DATE_FORMAT } from '../../src/constants';
import * as timeEntry from '../../src/lib/timeEntry';
import validations from '../../src/utils/validations';

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
    let valStub = null;
    beforeEach(() => {
      valStub = stub(validations, 'validateMinutes');
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
      valStub.withArgs(-1).returns('Time may not be negative.');
      expect(() => timeEntry.getEntryMinutes({ time: '-1' }))
        .to.throw();
    });
    it('reports the validation message in the error', () => {
      valStub.withArgs(-1).returns('Time may not be negative.');
      expect(() => timeEntry.getEntryMinutes({ time: '-1' }))
        .to.throw('Time may not be negative.');
    });
    it('returns an integer equal to the passed in time', () => {
      valStub.withArgs(123).returns(true);
      const result = timeEntry.getEntryMinutes({ time: '123' });
      expect(result).to.be.a('number');
      expect(result).to.equal(123);
    });
  });
});
