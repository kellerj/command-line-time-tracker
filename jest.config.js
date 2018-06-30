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
  moduleNameMapper: {
    '^@root(.*)$': '<rootDir>/src/$1',
    '^@commands(.*)$': '<rootDir>/src/commands/$1',
    '^@db(.*)$': '<rootDir>/db/$1',
    '^@lib(.*)$': '<rootDir>/src/lib/$1',
    '^@model(.*)$': '<rootDir>/src/model/$1',
    '^@utils(.*)$': '<rootDir>/src/utils/$1',
  },
};
