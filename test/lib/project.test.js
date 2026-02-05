import { expect } from 'chai';
import { jest, expect as jestExpect } from '@jest/globals';

// Mock the db module before importing the module under test
const mockInsert = jest.fn();
const mockDb = {
  project: {
    insert: mockInsert,
    getAll: jest.fn(),
    remove: jest.fn(),
  },
  timetype: {
    insert: jest.fn(),
    getAll: jest.fn(),
    remove: jest.fn(),
  },
  timeEntry: {
    insert: jest.fn(),
    update: jest.fn(),
    get: jest.fn(),
    remove: jest.fn(),
    getMostRecentEntry: jest.fn(),
    summarizeByProjectAndTimeType: jest.fn(),
    setDebug: jest.fn(),
  },
};

jest.unstable_mockModule('../../src/db/index.js', () => ({
  default: mockDb,
}));

// Import after setting up mocks
const { addNewProject } = await import('../../src/lib/project.js');

describe('lib/project', () => {
  let consoleLogSpy;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    mockInsert.mockReset();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('#addNewProject', () => {
    it('returns true with a summary message when insert succeeds', async () => {
      mockInsert.mockReturnValue(true);
      const result = await addNewProject('NewProjectName');
      jestExpect(mockInsert).toHaveBeenCalledWith('NewProjectName');
      jestExpect(mockInsert).toHaveBeenCalledTimes(1);
      expect(result).to.be.true; // eslint-disable-line no-unused-expressions
      expect(consoleLogSpy.mock.calls[0][0]).to.match(/.*Project.*added.*/);
      expect(consoleLogSpy.mock.calls[0][0]).to.match(/.*NewProjectName.*/);
    });

    it('returns false with a summary message when insert fails', async () => {
      mockInsert.mockImplementation(() => {
        throw new Error('Database Error Happened');
      });
      const result = await addNewProject('NewProjectName');
      jestExpect(mockInsert).toHaveBeenCalledWith('NewProjectName');
      jestExpect(mockInsert).toHaveBeenCalledTimes(1);
      expect(result).to.be.false; // eslint-disable-line no-unused-expressions
      expect(consoleLogSpy.mock.calls[0][0]).to.match(/.*Database Error Happened.*/);
    });

    it('returns false with a summary message project already exists', async () => {
      mockInsert.mockReturnValue(false);
      const result = await addNewProject('NewProjectName');
      jestExpect(mockInsert).toHaveBeenCalledWith('NewProjectName');
      jestExpect(mockInsert).toHaveBeenCalledTimes(1);
      expect(result).to.be.false; // eslint-disable-line no-unused-expressions
      expect(consoleLogSpy.mock.calls[0][0]).to.match(/.*already exists.*/);
      expect(consoleLogSpy.mock.calls[0][0]).to.match(/.*NewProjectName.*/);
    });

    it('returns false and does not blow up when null object passed', async () => {
      const result = await addNewProject(null);
      jestExpect(mockInsert).not.toHaveBeenCalled();
      expect(result).to.be.false; // eslint-disable-line no-unused-expressions
      expect(consoleLogSpy.mock.calls[0][0]).to.match(/.*Missing Project Name.*/);
    });

    it('returns false and does not blow up when empty string passed', async () => {
      const result = await addNewProject('');
      jestExpect(mockInsert).not.toHaveBeenCalled();
      expect(result).to.be.false; // eslint-disable-line no-unused-expressions
      expect(consoleLogSpy.mock.calls[0][0]).to.match(/.*Missing Project Name.*/);
    });

    it('returns false and does not blow up when whitespace-only string passed', async () => {
      const result = await addNewProject(' \t ');
      jestExpect(mockInsert).not.toHaveBeenCalled();
      expect(result).to.be.false; // eslint-disable-line no-unused-expressions
      expect(consoleLogSpy.mock.calls[0][0]).to.match(/.*Missing Project Name.*/);
    });
  });
});
