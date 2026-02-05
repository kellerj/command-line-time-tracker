import { expect } from 'chai';
import { format, subDays } from 'date-fns';

import dateUtils from '../../src/utils/date-utils.js';
import * as Constants from '../../src/constants.js';

describe('date-utils', () => {
  describe('#getEntryDate', () => {
    it('should return today\'s date when no date passed', () => {
      expect(dateUtils.getEntryDate(), 'when undefined passed').to.be.a('Date');
      expect(format(dateUtils.getEntryDate(), Constants.DATE_FORMAT), 'when undefined passed')
        .to.equal(format(new Date(), Constants.DATE_FORMAT));
      expect(dateUtils.getEntryDate(null), 'when null passed').to.be.a('Date');
      expect(format(dateUtils.getEntryDate(null), Constants.DATE_FORMAT), 'when null passed')
        .to.equal(format(new Date(), Constants.DATE_FORMAT));
      expect(dateUtils.getEntryDate(''), 'when \'\' passed').to.be.a('Date');
      expect(format(dateUtils.getEntryDate(''), Constants.DATE_FORMAT), 'when \'\' passed')
        .to.equal(format(new Date(), Constants.DATE_FORMAT));
    });
    it('should return yesterday\'s date when no date passed and flag set', () => {
      expect(dateUtils.getEntryDate('', true)).to.be.a('Date');
      expect(format(dateUtils.getEntryDate('', true), Constants.DATE_FORMAT))
        .to.equal(format(subDays(new Date(), 1), Constants.DATE_FORMAT));
    });
    it('should fail with an error when the passed in date is not valid', () => {
      expect(() => dateUtils.getEntryDate('2132132132'), '2132132132').to.throw();
      expect(() => dateUtils.getEntryDate('2018-13-1'), '2018-13-1').to.throw();
    });
    it('should parse and return the passed in date if valid', () => {
      expect(dateUtils.getEntryDate('2018-04-08')).to.be.a('Date');
      expect(format(dateUtils.getEntryDate('2018-04-08'), Constants.DATE_FORMAT)).to.equal('2018-04-08');
    });
    it('should fail with an error when passed in a date and the yesterday flag', () => {
      expect(() => dateUtils.getEntryDate('2018-04-08', true)).to.throw();
    });
  });
});
