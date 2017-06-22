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
      expect(typeof validations.validateAndDefaultInputDateString()).to.equal('object');
      expect(validations.validateAndDefaultInputDateString().format()).to.equal(today.format());
    });
    it('Strips off time component of a given date.', () => {
      const today = moment().startOf('day');
      expect(typeof validations.validateAndDefaultInputDateString(moment().format()))
        .to.equal('object');
      expect(validations.validateAndDefaultInputDateString(moment().format()).format())
        .to.equal(today.format());
    });
    it('returns error message when the date is invalid', () => {
      expect(typeof validations.validateAndDefaultInputDateString('skajhdsjkahdjkas'))
        .to.equal('string');
    });
  });

  describe('getStartAndEndDates', () => {
    describe('--week is set', () => {
      describe('--last is not set', () => {
        it('returns mon-sun of the current week when no date set', () => {
          const input = {
            week: true,
          };
          const result = validations.getStartAndEndDates(input);
          // console.log(JSON.stringify(result));
          expect(result).to.have.ownPropertyDescriptor('startDate');
          expect(result).to.have.ownPropertyDescriptor('endDate');
          expect(moment(result.startDate).format()).to.equal(moment().startOf('isoWeek').startOf('day').format());
          expect(moment(result.endDate).format()).to.equal(moment().endOf('isoWeek').startOf('day').format());
        });

        it('returns mon-sun of the given week when date set', () => {
          const input = {
            week: true,
            date: '2017-05-01',
          };
          const result = validations.getStartAndEndDates(input);
          // console.log(JSON.stringify(result));
          expect(result).to.have.ownPropertyDescriptor('startDate');
          expect(result).to.have.ownPropertyDescriptor('endDate');
          expect(moment(result.startDate).format()).to.equal(moment(input.date, 'YYYY-MM-DD').startOf('isoWeek').startOf('day').format());
          expect(moment(result.endDate).format()).to.equal(moment(input.date, 'YYYY-MM-DD').endOf('isoWeek').startOf('day').format());
        });
      });
      describe('--last is set', () => {
        it('returns mon-sun of the previous week when no date set', () => {
          const input = {
            week: true,
            last: true,
          };
          const result = validations.getStartAndEndDates(input);
          // console.log(JSON.stringify(result));
          expect(result).to.have.ownPropertyDescriptor('startDate');
          expect(result).to.have.ownPropertyDescriptor('endDate');
          expect(moment(result.startDate).format()).to.equal(
            moment().subtract(1, 'week')
            .startOf('isoWeek').startOf('day')
            .format());
          expect(moment(result.endDate).format()).to.equal(
            moment().subtract(1, 'week')
            .endOf('isoWeek').startOf('day')
            .format());
        });

        it('returns mon-sun of the week before the given week when date set', () => {
          const input = {
            week: true,
            last: true,
            date: '2017-05-01',
          };
          const result = validations.getStartAndEndDates(input);
          // console.log(JSON.stringify(result));
          expect(result).to.have.ownPropertyDescriptor('startDate');
          expect(result).to.have.ownPropertyDescriptor('endDate');
          expect(moment(result.startDate).format()).to.equal(
            moment(input.date, 'YYYY-MM-DD').subtract(1, 'week')
            .startOf('isoWeek').startOf('day')
            .format());
          expect(moment(result.endDate).format()).to.equal(
            moment(input.date, 'YYYY-MM-DD').subtract(1, 'week')
            .endOf('isoWeek').startOf('day')
            .format());
        });
      });
    });

    describe('--month is set', () => {
      describe('--last is not set', () => {
        it('returns 1st to last day of the current month when no date set', () => {
          const input = {
            month: true,
          };
          const result = validations.getStartAndEndDates(input);
          // console.log(JSON.stringify(result));
          expect(result).to.have.ownPropertyDescriptor('startDate');
          expect(result).to.have.ownPropertyDescriptor('endDate');
          expect(moment(result.startDate).format()).to.equal(moment().startOf('month').startOf('day').format());
          expect(moment(result.endDate).format()).to.equal(moment().endOf('month').startOf('day').format());
        });

        it('returns 1st to last day of the given month when date set', () => {
          const input = {
            month: true,
            date: '2017-05-15',
          };
          const result = validations.getStartAndEndDates(input);
          // console.log(JSON.stringify(result));
          expect(result).to.have.ownPropertyDescriptor('startDate');
          expect(result).to.have.ownPropertyDescriptor('endDate');
          expect(moment(result.startDate).format()).to.equal(moment(input.date, 'YYYY-MM-DD').startOf('month').startOf('day').format());
          expect(moment(result.endDate).format()).to.equal(moment(input.date, 'YYYY-MM-DD').endOf('month').startOf('day').format());
        });
      });
      describe('--last is set', () => {
        it('returns 1st to last day of the previous month when no date set', () => {
          const input = {
            month: true,
            last: true,
          };
          const result = validations.getStartAndEndDates(input);
          // console.log(JSON.stringify(result));
          expect(result).to.have.ownPropertyDescriptor('startDate');
          expect(result).to.have.ownPropertyDescriptor('endDate');
          expect(moment(result.startDate).format()).to.equal(
            moment().subtract(1, 'month')
            .startOf('month').startOf('day')
            .format());
          expect(moment(result.endDate).format()).to.equal(
            moment().subtract(1, 'month')
            .endOf('month').startOf('day')
            .format());
        });

        it('returns 1st to last day of the month before the given month when date set', () => {
          const input = {
            month: true,
            last: true,
            date: '2017-05-15',
          };
          const result = validations.getStartAndEndDates(input);
          // console.log(JSON.stringify(result));
          expect(result).to.have.ownPropertyDescriptor('startDate');
          expect(result).to.have.ownPropertyDescriptor('endDate');
          expect(moment(result.startDate).format()).to.equal(
            moment(input.date, 'YYYY-MM-DD').subtract(1, 'month')
            .startOf('month').startOf('day')
            .format());
          expect(moment(result.endDate).format()).to.equal(
            moment(input.date, 'YYYY-MM-DD').subtract(1, 'month')
            .endOf('month').startOf('day')
            .format());
        });
      });
    });
  });
});
