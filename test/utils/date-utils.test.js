import { expect } from 'chai';
import dateFns from 'date-fns';

import dateUtils from '../../src/utils/date-utils';

describe('date-utils', () => {
  describe('#getEntryDate', () => {
    it('should return today\'s date when no date passed', () => {
      expect(dateUtils.getEntryDate()).to.be.a('Date');
      expect(dateUtils.getEntryDate()).to.satisfy(date => dateFns.isSameDay(date, new Date()));
    });
    it('should return yesterday\'s date when no date passed and flag set');
    it('should fail with an error when the passed in date is not valid');
    it('should parse and return the passed in date if valid');
    it('should fail with an error when passed in a date and the yesterday flag');//, () => {
    // });
  });
});
