module.exports = {

  validateMinutes: (val) => {
    if (Number.isNaN(val)) {
      return 'Invalid Integer';
    } else if (Number.parseInt(val, 10) < 1) {
      return 'Time must be positive';
    } else if (Number.parseInt(val, 10) > 8 * 60) {
      return 'Time must be <= 8 hours';
    }
    return true;
  },

  validateEntryDescription: (input) => {
    if (!input) {
      return 'description is required';
    }
    return true;
  },

};
