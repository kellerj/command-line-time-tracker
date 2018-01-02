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
    this.footerData = {};
    LOG(`Initialized Table: ${JSON.stringify(this, null, 2)}`);
  }

  static defaultConfig() {
    return {
      columnDelimiter: '|',
      columnPadding: 1,
      // footerLines: 0,
      markdownStyleHeaderDivider: true,
      footerDivider: true,
      generateTotals: true,
      headerColumns: 0,
      footerColumns: 0,
    };
  }

  static defaultColumnInfo() {
    return {
      // columnHeading: undefined,
      align: 'left',
      dataType: 'string',
      printer: undefined,
      colorizer: undefined,
      width: undefined,
      footerType: 'none',
      footerPrinter: undefined,
      footerColorizer: undefined,
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
          const colInfo = Object.assign(Table.defaultColumnInfo(), { columnHeading: col });
          colInfo.dataType = typeof row[col];
          if (typeof row[col] === 'number') {
            colInfo.align = 'right';
          } else {
            colInfo.align = 'left';
          }
          colInfo.width = col.length;
          // make sure we have enough room for the markdown header divider line
          if (colInfo.width < 3) {
            colInfo.width = 3;
          }
          columnInfo.push(colInfo);
        }
      });
    });
    return columnInfo;
  }

  applyUserColumnInfo(userColumnInfo) {
    const newColumnInfo = [];
    userColumnInfo.forEach((col) => {
      const column = this.columnInfo.find(e => (e.columnHeading === col.columnHeading));
      // LOG(`${col.columnHeading} : ${JSON.stringify(column, null, 2)}`);
      // LOG(`Overlaying User Column: ${JSON.stringify(col, null, 2)}`);
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
        if (col.colorizer) {
          column.printer = col.colorizer;
        }
      }
      // LOG(`After Update: ${JSON.stringify(column, null, 2)}`);
      newColumnInfo.push(col);
    });
    this.columnInfo = newColumnInfo;
  }

  createFooterData() {
    const footerData = {};
    // get the columns which need summary information
    const summaryColumns = this.columnInfo.filter(e => (e.footerType && e.footerType !== 'none'));
    // iterate over all rows
    this.dataGrid.forEach((row) => {
      summaryColumns.forEach((col) => {
        if (col.footerType === 'sum') {
          if (!footerData[col.columnHeading]) {
            footerData[col.columnHeading] = 0;
          }
          footerData[col.columnHeading] += row[col.columnHeading];
        }
      });
    });
    this.footerData = footerData;
  }

  formatData() {
    // only use columns with printers
    const cols = this.columnInfo.filter(e => (typeof e.printer === 'function'));
    this.dataGrid.forEach((row) => {
      cols.forEach((col) => {
        const value = row[col.columnHeading];
        if (value) {
          row[col.columnHeading] = col.printer(value);
        }
      });
    });
  }

  calculateColumnWidths() {
    this.columnInfo.forEach((col) => {
      col.width = col.columnHeading.length;
    });
    this.dataGrid.forEach((row) => {
      Object.keys(row).forEach((col) => {
        const column = this.columnInfo.find(e => (e.columnHeading === col));
        if (!column) {
          LOG(`Error, unable to find column info for column ${col}.  ColumnInfo contained: ${JSON.stringify(this.columnInfo)}`);
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
    if (data && !Array.isArray(data)) {
      throw Error('data must be an Array object.');
    }
    if (columnInfo && !Array.isArray(columnInfo)) {
      throw Error('columnInfo must be an Array object.');
    }
    // clone the array object
    this.dataGrid = data.slice(0);
    // clone the array elements
    this.dataGrid.forEach((e, i, arr) => {
      arr[i] = Object.assign({}, e);
    });
    // get the column types
    this.columnInfo = this.deriveColumnInfo();
    if (columnInfo) {
      this.applyUserColumnInfo(columnInfo);
    }
    // check if we have any footer data
    this.config.footerRow = this.columnInfo.reduce((footerCount, col) => (col.footerType && col.footerType !== 'none')) > 0;
    // calculate any footer items
    if (this.config.footerRow) {
      this.createFooterData();
    }
    // format any data elements
    this.formatData();
    // calculate final column widths (based on headers and content)
    this.calculateColumnWidths();
    // TODO: colorize
    // this.colorizeColumnContents();
    LOG(`Final Table Object: ${JSON.stringify(this, (key, value) => ((typeof value === 'function') ? 'function' : value), 2)}`);
  }

  /**
   * Get the total character width of the table given the current data and options.
   * @return {number}
   */
  getTotalWidth() {
    return this.totalWidth;
  }

  writeRow(w, rowData) {
    const columnPadding = ' '.repeat(this.config.columnPadding);
    rowData.forEach((value, i) => {
      const col = this.columnInfo[i];
      let stringValue = '';
      if (value !== undefined && value !== null) {
        stringValue = value.toString();
      }
      w.write(this.config.columnDelimiter);
      w.write(columnPadding);
      if (col.align === 'right') {
        w.write(stringValue.padStart(col.width));
      } else {
        w.write(stringValue.padEnd(col.width));
      }
      w.write(columnPadding);
    });
    w.write(this.config.columnDelimiter);
    w.write('\n');
  }

  writeHeader(w) {
    // header
    const headerNames = this.columnInfo.map(e => e.columnHeading);
    this.writeRow(w, headerNames);
    const headerSeparators = this.columnInfo.map((e, i) => {
      const col = this.columnInfo[i];
      if (col.align === 'right') {
        return `${'-'.repeat(col.width - 1)}:`;
      } else if (col.align === 'center') {
        return `:${'-'.repeat(col.width - 2)}:`;
      }
      return `:${'-'.repeat(col.width - 1)}`;
    });
    this.writeRow(w, headerSeparators);
  }

  writeBody(w) {
    this.dataGrid.forEach((row) => {
      const rowData = this.columnInfo.map(e => row[e.columnHeading]);
      this.writeRow(w, rowData);
    });
  }

  writeDividerLine(w) {
    const headerSeparators = this.columnInfo.map((e, i) => '-'.repeat(this.columnInfo[i].width));
    this.writeRow(w, headerSeparators);
  }

  /**
   *
   * @param  {stream.Writable} w [description]
   * @return {void}
   */
  write(w) {
    this.writeHeader(w);
    this.writeBody(w);
    if (this.config.footerLines > 0) {
      if (this.config.footerDivider) {
        this.writeDividerLine(w);
      }
    }
  }

  toString() {
    // TODO: use write to a string writer
  }
}

// TODO: separate data property name and column header name
const displayUtils = require('./display-utils');

// LOG(displayUtils.timePrinter);
const columnInfo = [];
columnInfo.push({
  columnHeading: 'Column 4',
});
columnInfo.push({
  columnHeading: 'Column 333',
});
columnInfo.push({
  columnHeading: 'Column 1',
});
columnInfo.push({
  columnHeading: 'Column 22',
  align: 'right',
  footerType: 'sum',
  printer: displayUtils.timePrinter,
});
const data = [
  {
    'Column 333': 'Value 1-333',
    'Column 1': 'Value 1-1',
    'Column 22': 12,
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
];
/*
config:
  footerColumnHeadings: [ 'Totals' ]
 colInfo:
  footerType: 'sum',
  footerPrinter:
  footerColorizer:
 */
/*
[
  {
  col headings
  printer
  colorizer
  value / summary type
}
]
 */
// LOG(columnInfo[0].printer);
// testing code below
const t = new Table({
  footerLines: 1,
});
t.setData(data, columnInfo);
t.write(process.stdout);

const t2 = new Table({
  footerLines: 1,
  columnDelimiter: '',
});
LOG(JSON.stringify(data));
t2.setData(data, columnInfo);
t2.write(process.stdout);
