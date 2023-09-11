import { expect } from 'chai';
import moment from 'moment'; // TODO: Convert to use date-fns
import dateFns from 'date-fns';

// import { DATE_FORMAT } from '../../src/constants';
import validations from '../../src/utils/validations';

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
      const today = dateFns.startOfDay(new Date());
      expect(validations.validateAndDefaultInputDateString()).to.be.a('Date');
      expect(validations.validateAndDefaultInputDateString().toISOString())
        .to.equal(today.toISOString());
    });
    it('Strips off time component of a given date.', () => {
      const today = dateFns.startOfDay(new Date());
      expect(validations.validateAndDefaultInputDateString(dateFns.format(today)))
        .to.be.a('Date');
      expect(validations.validateAndDefaultInputDateString(dateFns.format(today)).toISOString())
        .to.equal(today.toISOString());
    });
    it('returns error message when the date is invalid', () => {
      expect(validations.validateAndDefaultInputDateString('skajhdsjkahdjkas'))
        .to.be.a('string');
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
          expect(result.startDate).to.be.a('Date');
          expect(result.endDate).to.be.a('Date');
          expect(result.startDate.toISOString())
            .to.equal(dateFns.startOfISOWeek(new Date()).toISOString());
          expect(result.endDate.toISOString())
            .to.equal(dateFns.startOfDay(dateFns.endOfISOWeek(new Date())).toISOString());
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
          expect(result.startDate).to.be.a('Date');
          expect(result.endDate).to.be.a('Date');
          expect(dateFns.format(result.startDate))
            .to.equal(dateFns.format(dateFns.startOfISOWeek(input.date)));
          expect(dateFns.format(result.endDate))
            .to.equal(dateFns.format(dateFns.startOfDay(dateFns.endOfISOWeek(input.date))));
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
          expect(result.startDate).to.be.a('Date');
          expect(result.endDate).to.be.a('Date');
          expect(moment(result.startDate).format()).to.equal(moment().subtract(1, 'week')
            .startOf('isoWeek').startOf('day')
            .format());
          expect(moment(result.endDate).format()).to.equal(moment().subtract(1, 'week')
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
          expect(result.startDate).to.be.a('Date');
          expect(result.endDate).to.be.a('Date');
          expect(moment(result.startDate).format()).to.equal(moment(input.date, 'YYYY-MM-DD').subtract(1, 'week')
            .startOf('isoWeek').startOf('day')
            .format());
          expect(moment(result.endDate).format()).to.equal(moment(input.date, 'YYYY-MM-DD').subtract(1, 'week')
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
          expect(result.startDate).to.be.a('Date');
          expect(result.endDate).to.be.a('Date');
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
          expect(result.startDate).to.be.a('Date');
          expect(result.endDate).to.be.a('Date');
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
          expect(result.startDate).to.be.a('Date');
          expect(result.endDate).to.be.a('Date');
          expect(moment(result.startDate).format()).to.equal(moment().subtract(1, 'month')
            .startOf('month').startOf('day')
            .format());
          expect(moment(result.endDate).format()).to.equal(moment().subtract(1, 'month')
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
          expect(result.startDate).to.be.a('Date');
          expect(result.endDate).to.be.a('Date');
          expect(moment(result.startDate).format()).to.equal(moment(input.date, 'YYYY-MM-DD').subtract(1, 'month')
            .startOf('month').startOf('day')
            .format());
          expect(moment(result.endDate).format()).to.equal(moment(input.date, 'YYYY-MM-DD').subtract(1, 'month')
            .endOf('month').startOf('day')
            .format());
        });
      });
    });

    describe('neither --week or --month are set', () => {
      it('returns today as the start and end date when no date input', () => {
        const input = {
        };
        const result = validations.getStartAndEndDates(input);
        expect(result.startDate).to.be.a('Date');
        expect(result.endDate).to.be.a('Date');
        expect(moment(result.startDate).format()).to.equal(moment().startOf('day').format());
        expect(moment(result.endDate).format()).to.equal(moment(result.startDate).format());
      });
      it('when --last, returns yesterday as the start and end date when no date input', () => {
        const input = {
          last: true,
        };
        const result = validations.getStartAndEndDates(input);
        expect(result.startDate).to.be.a('Date');
        expect(result.endDate).to.be.a('Date');
        expect(moment(result.startDate).format()).to.equal(moment().subtract(1, 'day').startOf('day').format());
        expect(moment(result.endDate).format()).to.equal(moment(result.startDate).format());
      });
      it('returns the given date as the start and end date', () => {
        const input = {
          date: '2017-05-15',
        };
        const result = validations.getStartAndEndDates(input);
        expect(result.startDate).to.be.a('Date');
        expect(result.endDate).to.be.a('Date');
        expect(moment(result.startDate).format()).to.equal(moment(input.date, 'YYYY-MM-DD').startOf('day').format());
        expect(moment(result.endDate).format()).to.equal(moment(result.startDate).format());
      });
      it('when --last, returns the day before given date as the start and end date', () => {
        const input = {
          date: '2017-05-15',
          last: true,
        };
        const result = validations.getStartAndEndDates(input);
        expect(result.startDate).to.be.a('Date');
        expect(result.endDate).to.be.a('Date');
        expect(moment(result.startDate).format()).to.equal(moment(input.date, 'YYYY-MM-DD').subtract(1, 'day').startOf('day').format());
        expect(moment(result.endDate).format()).to.equal(moment(result.startDate).format());
      });
      it('returns the given start date as the start and today as the end date when no end date given', () => {
        const input = {
          startDate: '2017-05-15',
        };
        const result = validations.getStartAndEndDates(input);
        expect(result.startDate).to.be.a('Date');
        expect(result.endDate).to.be.a('Date');
        expect(moment(result.startDate).format()).to.equal(moment(input.startDate, 'YYYY-MM-DD').startOf('day').format());
        expect(moment(result.endDate).format()).to.equal(moment().startOf('day').format());
      });
      it('returns the given start and end dates as the start and end dates when both given', () => {
        const input = {
          startDate: '2017-05-15',
          endDate: '2017-05-16',
        };
        const result = validations.getStartAndEndDates(input);
        expect(result.startDate).to.be.a('Date');
        expect(result.endDate).to.be.a('Date');
        expect(moment(result.startDate).format()).to.equal(moment(input.startDate, 'YYYY-MM-DD').startOf('day').format());
        expect(moment(result.endDate).format()).to.equal(moment(input.endDate, 'YYYY-MM-DD').startOf('day').format());
      });
      it('returns the given start and end dates as the start and end dates when both given', () => {
        const input = {
          startDate: '2017-05-15',
          endDate: '2017-05-15',
        };
        const result = validations.getStartAndEndDates(input);
        expect(result.startDate).to.be.a('Date');
        expect(result.endDate).to.be.a('Date');
        expect(moment(result.startDate).format()).to.equal(moment(input.startDate, 'YYYY-MM-DD').startOf('day').format());
        expect(moment(result.endDate).format()).to.equal(moment(input.endDate, 'YYYY-MM-DD').startOf('day').format());
      });
      it('sets the start date to the end date when end date before start date', () => {
        const input = {
          startDate: '2017-05-16',
          endDate: '2017-05-15',
        };
        const result = validations.getStartAndEndDates(input);
        expect(result.startDate).to.be.a('Date');
        expect(result.endDate).to.be.a('Date');
        expect(moment(result.startDate).format()).to.equal(moment(input.endDate, 'YYYY-MM-DD').startOf('day').format());
        expect(moment(result.endDate).format()).to.equal(moment(input.endDate, 'YYYY-MM-DD').startOf('day').format());
      });
      it('returns an error message when given an invalid date', () => {
        const input = {
          date: 'NOT_A_DATE',
        };
        const result = validations.getStartAndEndDates(input);
        expect(result.startDate).to.be.undefined; // eslint-disable-line no-unused-expressions
        expect(result.endDate).to.be.undefined; // eslint-disable-line no-unused-expressions
        expect(result.errorMessage).to.be.a('string');
        expect(result.errorMessage).to.not.equal('');
      });
      it('returns an error message when given an invalid start date', () => {
        const input = {
          startDate: 'NOT_A_DATE',
        };
        const result = validations.getStartAndEndDates(input);
        expect(result.startDate).to.be.undefined; // eslint-disable-line no-unused-expressions
        expect(result.endDate).to.be.undefined; // eslint-disable-line no-unused-expressions
        expect(result.errorMessage).to.be.a('string');
        expect(result.errorMessage).to.not.equal('');
      });
      it('returns an error message when given an invalid start date', () => {
        const input = {
          endDate: 'NOT_A_DATE',
        };
        const result = validations.getStartAndEndDates(input);
        expect(result.startDate).to.be.undefined; // eslint-disable-line no-unused-expressions
        expect(result.endDate).to.be.undefined; // eslint-disable-line no-unused-expressions
        expect(result.errorMessage).to.be.a('string');
        expect(result.errorMessage).to.not.equal('');
      });
    });
  });
});
