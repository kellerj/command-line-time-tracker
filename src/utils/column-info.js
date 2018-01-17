/**
 * @class ColumnInfo
 */
export default class ColumnInfo {
  constructor(name, alignment) {
    this.columnHeading = name;
    this.align = alignment || 'left';
    this.dataType = 'string';
    this.printer = undefined;
    this.colorizer = undefined;
    this.width = undefined;
    this.footerType = 'none';
    this.footerPrinter = undefined;
    this.footerColorizer = undefined;
  }

  /**
   * Overlay non-blank information from the given object onto this one.
   * @param  {ColumnInfo} col
   * @return {void}
   */
  overlay(col) {
    this.align = col.align || this.align;
    this.dataType = col.dataType || this.dataType;
    this.printer = col.printer || this.printer;
    this.colorizer = col.colorizer || this.colorizer;
    this.footerType = col.footerType || this.footerType;
    this.footerPrinter = col.footerPrinter || this.footerPrinter;
    this.footerColorizer = col.footerColorizer || this.footerColorizer;
  }
}
