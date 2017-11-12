import { expect, assert } from 'chai';
import { stub, spy } from 'sinon';

import * as project from '../../src/lib/project';
import db from '../../src/db';

context('lib/timeEntry', () => {
  describe('#addNewProject', () => {
    beforeEach(() => {
      stub(db.project, 'insert');
      spy(console, 'log');
    });
    afterEach(() => {
      db.project.insert.restore();
      console.log.restore();
    });
    it('returns true with a summary message when insert succeeds', async () => {
      db.project.insert.returns(true);
      const result = await project.addNewProject('NewProjectName');
      assert(db.project.insert.calledOnce, 'db insert should have been called');
      assert(db.project.insert.calledWith('NewProjectName'), 'Should have passed in the project name to the db.insert call');
      expect(result).to.be.true; // eslint-disable-line no-unused-expressions
      expect(console.log.getCall(0).args[0]).to.match(/.*Project.*added.*/);
      expect(console.log.getCall(0).args[0], 'should have contained project name').to.match(/.*NewProjectName*/);
    });
    it('returns false with a summary message when insert fails', async () => {
      db.project.insert.throws('MongoDB Error Happened');
      const result = await project.addNewProject('NewProjectName');
      assert(db.project.insert.calledOnce, 'db insert should have been called');
      assert(db.project.insert.calledWith('NewProjectName'), 'Should have passed in the project name to the db.insert call');
      expect(result).to.be.false; // eslint-disable-line no-unused-expressions
      expect(console.log.getCall(0).args[0]).to.match(/.*MongoDB Error Happened.*/);
    });
    it('returns false with a summary message project already exists', async () => {
      db.project.insert.returns(false);
      const result = await project.addNewProject('NewProjectName');
      assert(db.project.insert.calledOnce, 'db insert should have been called');
      assert(db.project.insert.calledWith('NewProjectName'), 'Should have passed in the project name to the db.insert call');
      expect(result).to.be.false; // eslint-disable-line no-unused-expressions
      expect(console.log.getCall(0).args[0]).to.match(/.*already exists.*/);
      expect(console.log.getCall(0).args[0], 'should have contained project name').to.match(/.*NewProjectName*/);
    });
    it('returns false and does not blow up when null object passed', async () => {
      const result = await project.addNewProject(null);
      assert(db.project.insert.notCalled, 'The db insert command should not have been called');
      expect(result).to.be.false; // eslint-disable-line no-unused-expressions
      expect(console.log.getCall(0).args[0]).to.match(/.*Missing Project Name.*/);
    });
    it('returns false and does not blow up when empty string passed', async () => {
      const result = await project.addNewProject('');
      assert(db.project.insert.notCalled, 'The db insert command should not have been called');
      expect(result).to.be.false; // eslint-disable-line no-unused-expressions
      expect(console.log.getCall(0).args[0]).to.match(/.*Missing Project Name.*/);
    });
    it('returns false and does not blow up when whitespace-only string passed', async () => {
      const result = await project.addNewProject(' \t ');
      assert(db.project.insert.notCalled, 'The db insert command should not have been called');
      expect(result).to.be.false; // eslint-disable-line no-unused-expressions
      expect(console.log.getCall(0).args[0]).to.match(/.*Missing Project Name.*/);
    });
  });
});
