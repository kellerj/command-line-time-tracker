const validations = require('../../utils/validations');
const expect = require('chai').expect;

describe('validations', () => {
  describe('validateMinutes', () => {
    it('returns false for a string input', () => {
      expect(validations.validateMinutes('ABC')).to.equal(true);
    });
  });
});
