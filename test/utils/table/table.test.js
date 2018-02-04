
import chai, { expect } from 'chai';
import { Table, ColumnInfo } from '../../../src/utils/table';

chai.use(require('chai-shallow-deep-equal'));

describe('class Table', () => {
  describe('constructor', () => {
    it('should use the default config when no argument passed', () => {
      const t = new Table();
      expect(t.config).to.shallowDeepEqual(Table.defaultConfig());
    });
    it('should use the default config when an empty object passed', () => {
      const t = new Table({});
      expect(t.config).to.shallowDeepEqual(Table.defaultConfig());
    });
    it('should copy all the properties from the source object', () => {
      const configObject = {
        someProperty: 'someValue',
        someOtherProperty: 'someOtherValue',
      };
      const t = new Table(configObject);
      expect(t.config).to.shallowDeepEqual(configObject, 'should have copied all props from the source object');
      expect(t.config).to.shallowDeepEqual(Table.defaultConfig(), 'with no overlaps, the object should also have contained all default config items');
    });
    it('should use the markdown config when a markdown property is truthy', () => {
      const t = new Table({ markdown: true });
      expect(t.config).to.shallowDeepEqual(Table.markdownConfig());
    });
    it('passed in properties should not overwrite default properties', () => {
      const configObject = {
        columnDelimiter: '**',
        columnDelimiterAtStart: true,
        columnDelimiterAtEnd: true,
      };
      const t = new Table(configObject);
      expect(t.config).to.shallowDeepEqual(configObject, 'should have copied all props from the source object');
      expect(t.config).to.not.shallowDeepEqual(Table.defaultConfig());
    });
  });
  describe('setData', () => {
    it('should throw an error if data or columnInfo are not arrays');
    it('should not modify the original data array');
    it('should have copied the elements of the original array');
    it('should not modify the original column info array');
  });
  describe('deriveColumnInfo', () => {
    const t = new Table();
    t.dataGrid = [
      {
        Column1: 'string value',
        Column2: 'string value 2',
      },
      {
        Column3: 123,
        Column2: 'another column',
        Column1: 456,
      },
      {
        Column4: new Date(),
        a: 'abc',
      },
    ];
    const columnInfo = t.deriveColumnInfo();
    it('should add an array element for each distinct property in the data', () => {
      expect(columnInfo.length).to.equal(5);
      const columnNames = columnInfo.map(col => (col.columnHeading));
      expect(columnNames).to.include('Column1', 'Column2', 'Column3', 'Column4', 'a');
    });
    it('should default to right alignment if the first element found for a property is a number', () => {
      expect(columnInfo.find(col => col.columnHeading === 'Column3').align).to.equal('right');
      expect(columnInfo.find(col => col.columnHeading === 'Column1').align).to.equal('left');
    });
    it('all added elements should be ColumnInfo objects', () => {
      for (let i = 0; i < columnInfo.length; i++) {
        expect(columnInfo[i]).to.be.instanceOf(ColumnInfo);
      }
    });
    it('default column width should be the width of the header', () => {
      expect(columnInfo.find(col => col.columnHeading === 'Column1').width).to.equal(7);
    });
    it('default column width should never be less than 3', () => {
      expect(columnInfo.find(col => col.columnHeading === 'a').width).to.equal(3);
    });
  });
});
