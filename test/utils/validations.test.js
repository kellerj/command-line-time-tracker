const validations = require('../../utils/validations');
const expect = require('chai').expect;
// const assert = require('chai').assert;
const moment = require('moment');

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

  describe('validateEntryDescription', () => {
    it('returns true for a non-blank string', () => {
      expect(validations.validateEntryDescription('This is a description')).to.equal(true);
    });
    it('returns true for the string false', () => {
      expect(validations.validateEntryDescription('false')).to.equal(true);
    });
    it('returns false for a blank string', () => {
      expect(validations.validateEntryDescription('')).to.equal('description is required');
    });
    it('returns false for undefined', () => {
      expect(validations.validateEntryDescription()).to.equal('description is required');
    });
  });

  describe('validateProjectName', () => {
    it('returns true for a non-blank string', () => {
      expect(validations.validateProjectName('project name')).to.equal(true);
    });
    it('returns false for a blank string', () => {
      expect(validations.validateProjectName('')).to.equal('project name is required');
    });
    it('returns false for undefined', () => {
      expect(validations.validateProjectName()).to.equal('project name is required');
    });
  });

  describe('validateAndDefaultInputDateString', () => {
    it('returns today when no date passed', () => {
      const today = moment().startOf('day');
      expect(validations.validateAndDefaultInputDateString().format()).to.equal(today.format());
    });
    it('Strips off time component of a given date.', () => {
      const today = moment().startOf('day');
      expect(validations.validateAndDefaultInputDateString(moment().format()).format())
        .to.equal(today.format());
    });
    it('returns error message when the date is invalid', () => {
      expect(typeof validations.validateAndDefaultInputDateString('skajhdsjkahdjkas'))
        .to.equal('string');
    });
  });
});
