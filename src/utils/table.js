/**
 * @class Table
 */
const LOG = require('debug')('tt:utils:Table');

export default class Table {
  constructor(config) {
    const newConfig = {};
    Object.assign(newConfig, Table.defaultConfig(), config);
    this.config = newConfig;
    this.dataGrid = [];
    this.columnInfo = [];
    this.totalWidth = 0;
    LOG(`Initialized Table: ${JSON.stringify(this, null, 2)}`);
  }

  static defaultConfig() {
    return {
      columnDelimiter: '|',
      columnPadding: 1,
      footerLines: 0,
      footerDivider: true,
      generateTotals: true,
      headerColumns: 0,
      footerColumns: 0,
    };
  }

  static defaultColumnInfo() {
    return {
      columnHeading: undefined,
      align: undefined,
      dataType: undefined,
      printer: undefined,
      colorizer: undefined,
      width: undefined,
    };
  }

  deriveColumnInfo() {
    // loop over all data
    // determine data type of each
    // set align based on type
    const columnInfo = [];
    this.dataGrid.forEach((row) => {
      Object.keys(row).forEach((col) => {
        if (!columnInfo.find(e => (e.columnHeading === col))) {
          LOG(`${col} not in the columnInfo object, adding`);
          const colInfo = { columnHeading: col };
          colInfo.dataType = typeof row[col];
          if (typeof row[col] === 'number') {
            colInfo.align = 'right';
          } else {
            colInfo.align = 'left';
          }
          colInfo.width = 1;
          columnInfo.push(colInfo);
        }
      });
    });
    return columnInfo;
  }

  applyUserColumnInfo(userColumnInfo) {
    userColumnInfo.forEach((col) => {
      const column = this.columnInfo.find(e => (e.columnHeading === col.columnHeading));
      if (col) {
        if (col.align) {
          column.align = col.align;
        }
        if (col.dataType) {
          column.dataType = col.dataType;
        }
        if (col.printer) {
          column.printer = col.printer;
        }
      }
    });
  }

  formatData() {

  }

  calculateColumnWidths() {
    this.columnInfo.forEach((col) => {
      col.width = col.columnHeading.length;
    });
    this.dataGrid.forEach((row) => {
      Object.keys(row).forEach((col) => {
        const column = this.columnInfo.find(e => (e.columnHeading === col));
        if (!column) {
          LOG(`Error, unable to find column info for column ${col}.  ColumnInfo contained: ${JSON.stringify(this.columnInfo, null, 2)}`);
          return;
        }
        const value = row[col];
        if (value !== undefined && column.width < value.toString().length) {
          column.width = value.toString().length;
        }
      });
    });
    this.totalWidth = this.columnInfo.reduce((totalWidth, col) =>
      (totalWidth + col.width + this.config.columnDelimiter.length
        + (this.config.columnPadding * 2)), 0);
    this.totalWidth += 1;
  }

  setData(data, columnInfo) {
    if (!Array.isArray(data)) {
      throw Error('data must be an Array object.');
    }
    if (columnInfo && !Array.isArray(columnInfo)) {
      throw Error('columnInfo must be an Array object.');
    }
    // clone the array object
    this.dataGrid = data.slice(0);
    // clone the array elements
    this.dataGrid.forEach(e => (Object.assign({}, e)));
    // get the column types
    this.columnInfo = this.deriveColumnInfo();
    if (columnInfo) {
      this.applyUserColumnInfo(columnInfo);
    }
    // TODO: format any data elements
    this.formatData();
    // calculate final column widths (based on headers and content)
    this.calculateColumnWidths();
    // this.columnInfo = columnInfo;
    LOG(`Final Table Object: ${JSON.stringify(this, null, 2)}`);
  }

  /**
   * Get the total character width of the table given the current data and options.
   * @return {number}
   */
  getTotalWidth() {
    return this.totalWidth;
  }

  /**
   *
   * @param  {stream.Writable} w [description]
   * @return {void}
   */
  write(w) {
    const columnPadding = ' '.repeat(this.config.columnPadding);
    // TODO: header
    this.columnInfo.forEach((col) => {
      w.write(this.config.columnDelimiter);
      w.write(columnPadding);
      if (col.align === 'right') {
        w.write(col.columnHeading.padStart(col.width));
      } else {
        w.write(col.columnHeading.padEnd(col.width));
      }
      w.write(columnPadding);
    });
    w.write(this.config.columnDelimiter);
    w.write('\n');
    this.columnInfo.forEach((col) => {
      w.write(this.config.columnDelimiter);
      w.write(columnPadding);
      if (col.align === 'right') {
        w.write('-'.repeat(col.width - 1));
        w.write(':');
      } else if (col.align === 'center') {
        w.write(':');
        w.write('-'.repeat(col.width - 2));
        w.write(':');
      } else {
        w.write(':');
        w.write('-'.repeat(col.width - 1));
      }
      w.write(columnPadding);
    });
    w.write(this.config.columnDelimiter);
    w.write('\n');
    // TODO: body
    // TODO: footer
  }

  toString() {
    // TODO: use write to a string writer
  }
}

// testing code below
const t = new Table();
t.setData([
  {
    'Column 1': 'Value 1-1',
    'Column 22': 12,
    'Column 333': 'Value 1-333',
  },
  {
    'Column 1': 'Value 2-1',
    'Column 333': 'Value 2-333',
  },
  {
    'Column 4': 'Value 3-4',
  },
  {
    'Column 22': 342,
  },
]);
t.write(process.stdout);
