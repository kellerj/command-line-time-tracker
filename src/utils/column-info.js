/**
 * @class ColumnInfo
 */
export default class ColumnInfo {
  /**
   * [constructor description]
   * @param {string} name      [description]
   * @param {string} alignment [description]
   * @param {function} printer   [description]
   */
  constructor(name, alignment = 'left', printer, colorizer, footerType = 'none') {
    this.columnHeading = name;
    this.align = alignment || 'left';
    /**
     * general data type of the contents of the column
     * @type {String}
     */
    this.dataType = 'string';
    /**
     * Function used to format the data before display.
     * @type {function}
     * @public
     */
    this.printer = printer;
    this.colorizer = colorizer;
    this.width = undefined;
    this.footerType = footerType || 'none';
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
