module.exports = {
  roots: [
    '<rootDir>/src', '<rootDir>/test',
  ],
  projects: [
    {
      displayName: 'test',
    }, {
      displayName: 'lint',
      runner: 'jest-runner-eslint',
      testMatch: ['<rootDir>/src/**/*.js'],
    },
  ],
  verbose: false,
  collectCoverage: false,
  testEnvironment: 'node',
  coveragePathIgnorePatterns: [
    '<rootDir>/src/commands', '<rootDir>/coverage', '<rootDir>/dist', '<rootDir>/node_modules',
  ],
  coverageReporters: ['lcov', 'text-summary', 'text', 'html'],
};
