const validations = require('../../utils/validations');
const expect = require('chai').expect;

describe('validations', () => {
  describe('validateMinutes', () => {
    it('returns true for a positive numeric input', () => {
      expect(validations.validateMinutes('123')).to.equal(true);
    });
    it('returns error message for a zero numeric input', () => {
      expect(validations.validateMinutes('0')).to.equal('Time must be positive');
    });
    it('returns error message for a negative numeric input', () => {
      expect(validations.validateMinutes('-123')).to.equal('Time must be positive');
    });
    it('returns error message for input longer than 8 hours', () => {
      expect(validations.validateMinutes('1000')).to.equal('Time must be <= 8 hours');
    });
    it('returns error message for a string input', () => {
      expect(validations.validateMinutes('ABC')).to.equal('Invalid Integer');
    });
  });
});
