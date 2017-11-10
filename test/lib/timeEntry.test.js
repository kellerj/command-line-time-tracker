import { expect, assert } from 'chai';
import { spy, stub } from 'sinon';
import dateFns from 'date-fns';

import { DATE_FORMAT } from '../../src/constants';
import * as timeEntry from '../../src/lib/timeEntry';

console.log(DATE_FORMAT);

context('lib/timeEntry', () => {
  describe('#getEntryDate', () => {
    describe('no "date" parameter', () => {
      it('returns today\'s date', () => {
        const result = timeEntry.getEntryDate({});
        expect(result).to.be.a('string');
        expect(result).to.equal(dateFns.format(new Date(), DATE_FORMAT));
      });
      it.skip('returns yesterday\'s date when --yesterday flag set', () => {

      });
    });
    describe('"date" parameter given', () => {
      it.skip('returns the given date if given as a parameter', () => {

      });
      it.skip('ignores the --yesterday parameter', () => {

      });
      it.skip('throws an error if it can not parse the date', () => {

      });
    });
  });
});
