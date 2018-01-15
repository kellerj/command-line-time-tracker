/**
 * @class Table
 */
import streamBuffers from 'stream-buffers';

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
      columnDelimiter: '  ',
      columnDelimiterAtStart: false,
      columnDelimiterAtEnd: false,
      columnPadding: 0,
      alignmentMarkerInHeader: false,
      markdownStyleHeaderDivider: true,
      footerDivider: true,
      generateTotals: true,
      dividerColorizer: str => str,
      headerColorizer: str => str,
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
          if (colInfo.dataType === 'number') {
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
          //LOG(`Added Column Object: ${JSON.stringify(colInfo, null, 2)}`);
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
        column.align = col.align ? col.align : column.align;
        column.dataType = col.dataType ? col.dataType : column.dataType;
        column.printer = col.printer ? col.printer : column.printer;
        column.colorizer = col.colorizer ? col.colorizer : column.colorizer;
        column.footerType = col.footerType ? col.footerType : column.footerType;
        column.footerPrinter = col.footerPrinter ? col.footerPrinter : column.footerPrinter;
        column.footerColorizer = col.footerColorizer ? col.footerColorizer : column.footerColorizer;
      }
      // LOG(`After Update: ${JSON.stringify(column, null, 2)}`);
      newColumnInfo.push(column);
    });
    this.columnInfo = newColumnInfo;
  }

  createFooterData() {
    const footerData = {};
    // get the columns which need summary information
    const summaryColumns = this.columnInfo.filter(e => (e && e.footerType && e.footerType !== 'none'));
    // iterate over all rows
    this.dataGrid.forEach((row) => {
      summaryColumns.forEach((col) => {
        if (col.footerType === 'sum') {
          if (!footerData[col.columnHeading]) {
            footerData[col.columnHeading] = 0;
          }
          if (row[col.columnHeading]) {
            footerData[col.columnHeading] += row[col.columnHeading];
          }
        } else {
          footerData[col.columnHeading] = col.footerType;
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
    cols.forEach((col) => {
      const value = this.footerData[col.columnHeading];
      if (value) {
        if (typeof col.footerPrinter === 'function') {
          this.footerData[col.columnHeading] = col.footerPrinter(value);
        } else {
          this.footerData[col.columnHeading] = col.printer(value);
        }
      }
    });
  }

  colorizeColumnContents() {
    // only use columns with colorizers
    const cols = this.columnInfo.filter(e => (typeof e.colorizer === 'function'));
    // handle body
    this.dataGrid.forEach((row) => {
      cols.forEach((col) => {
        const value = row[col.columnHeading];
        if (value) {
          row[col.columnHeading] = col.colorizer(value);
        }
      });
    });
    // handle footer
    const footerCols = this.columnInfo.filter(e => (typeof e.footerColorizer === 'function'));
    if (this.footerData) {
      footerCols.forEach((col) => {
        const value = this.footerData[col.columnHeading];
        if (value) {
          this.footerData[col.columnHeading] = col.footerColorizer(value);
        }
      });
    }
  }

  processRowWidths(row) {
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
  }

  calculateColumnWidths() {
    this.columnInfo.forEach((col) => {
      col.width = col.columnHeading.length;
    });
    this.dataGrid.forEach((row) => {
      this.processRowWidths(row);
    });
    if (this.footerData) {
      this.processRowWidths(this.footerData);
    }
    this.totalWidth = this.columnInfo.reduce((totalWidth, col) =>
      (totalWidth + col.width + this.config.columnDelimiter.length
        + (this.config.columnPadding * 2)), 0);
    // if no column delimiter at start, subtract that since included in above
    if (!this.config.columnDelimiterAtStart) {
      this.totalWidth -= this.config.columnDelimiter.length;
    }
    if (this.config.columnDelimiterAtEnd) {
      this.totalWidth += this.config.columnDelimiter.length;
    }
  }

  padRowValues(row) {
    this.columnInfo.forEach((col) => {
      const value = row[col.columnHeading];
      let stringValue = '';
      if (value !== undefined && value !== null) {
        stringValue = value.toString().trim();
      }
      if (col.align === 'right') {
        row[col.columnHeading] = stringValue.padStart(col.width);
      } else {
        row[col.columnHeading] = stringValue.padEnd(col.width);
      }
    });
  }

  padValuesForAlignment() {
    // LOG(`Before Padding: ${JSON.stringify(this.dataGrid, null, 2)}`);
    this.dataGrid.forEach((row) => {
      this.padRowValues(row);
    });
    if (this.footerData) {
      this.padRowValues(this.footerData);
    }
    // LOG(`After Padding: ${JSON.stringify(this.dataGrid, null, 2)}`);
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
    // pad column values - this needs to happen before colorization
    // as the ansi codes used for colorizing change the apparent value length
    this.padValuesForAlignment();
    // colorize
    this.colorizeColumnContents();
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
      if (i !== 0 || this.config.columnDelimiterAtStart) {
        w.write(this.config.columnDelimiter);
      }
      w.write(columnPadding);
      w.write(value);
      w.write(columnPadding);
    });
    if (this.config.columnDelimiterAtEnd) {
      w.write(this.config.columnDelimiter);
    }
    w.write('\n');
  }

  writeHeader(w) {
    // header
    const headerNames = this.columnInfo.map((col) => {
      if (col.align === 'right') {
        return this.config.headerColorizer(col.columnHeading.padStart(col.width));
      }
      return this.config.headerColorizer(col.columnHeading.padEnd(col.width));
    });
    this.writeRow(w, headerNames);
    const headerSeparators = this.columnInfo.map((e, i) => {
      const col = this.columnInfo[i];
      if (this.config.alignmentMarkerInHeader) {
        if (col.align === 'right') {
          return this.config.dividerColorizer(`${'-'.repeat(col.width - 1)}:`);
        } else if (col.align === 'center') {
          return this.config.dividerColorizer(`:${'-'.repeat(col.width - 2)}:`);
        }
        return this.config.dividerColorizer(`:${'-'.repeat(col.width - 1)}`);
      }
      return this.config.dividerColorizer('-'.repeat(col.width));
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
    const headerSeparators = this.columnInfo.map((e, i) => this.config.dividerColorizer('-'.repeat(this.columnInfo[i].width)));
    this.writeRow(w, headerSeparators);
  }

  writeFooter(w) {
    const rowData = this.columnInfo.map(e => this.footerData[e.columnHeading]);
    this.writeRow(w, rowData);
  }

  /**
   *
   * @param  {stream.Writable} w [description]
   * @return {void}
   */
  write(w) {
    this.writeHeader(w);
    this.writeBody(w);
    if (this.config.footerRow) {
      if (this.config.footerDivider) {
        this.writeDividerLine(w);
      }
    }
    this.writeFooter(w);
  }

  toString() {
    const buffer = new streamBuffers.WritableStreamBuffer();
    this.write(buffer);
    return buffer.getContentsAsString('utf-8');
  }
}

// testing code below

// TODO: separate data property name and column header name
// const displayUtils = require('./display-utils');
//
// // LOG(displayUtils.durationPrinter);
// const columnInfo = [];
// columnInfo.push({
//   columnHeading: 'Column 4',
// });
// columnInfo.push({
//   columnHeading: 'Column 333',
//   colorizer: require('chalk').red,
// });
// columnInfo.push({
//   columnHeading: 'Column 1',
// });
// columnInfo.push({
//   columnHeading: 'Column 22',
//   align: 'right',
//   footerType: 'sum',
//   printer: displayUtils.durationPrinter,
//   footerPrinter: displayUtils.timeAndPercentPrinter(360),
// });
// const data = [
//   {
//     'Column 333': 'Value 1-333',
//     'Column 1': 'Value 1-1',
//     'Column 22': 12,
//   },
//   {
//     'Column 1': 'Value 2-1',
//     'Column 333': 'Value 2-333',
//   },
//   {
//     'Column 4': 'Value 3-4',
//   },
//   {
//     'Column 22': 342,
//   },
// ];
// // LOG(columnInfo[0].printer);
// const t = new Table({
//   footerLines: 1,
// });
// t.setData(data, columnInfo);
// t.write(process.stdout);
//
// const t2 = new Table({
//   footerLines: 1,
//   columnDelimiter: '',
// });
// LOG(JSON.stringify(data));
// t2.setData(data, columnInfo);
// t2.write(process.stdout);
