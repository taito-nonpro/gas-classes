'use strict'

class Sheet {

  /**
   * シートに関するコンストラクタ
   * @constructor
   * @param {SpreadsheetApp.sheet} sheet - 対象となるシート オブジェクト
   * @param {number} headerRows - ヘッダーの行数
   * @param {number} headerIndex - ヘッダー行のインデックス (ユニークなカラム)
   */
  constructor(sheet = SpreadsheetApp.getActiveSheet(), headerRows = 1, headerIndex = headerRows - 1) {
    /** @type {SpreadsheetApp.Sheet} */
    this.sheet = sheet;
    /** @type {number} */
    this.headerRows = headerRows;
    /** @type {number} */
    this.headerIndex = headerIndex;
  }

  /**
   * Class Sheet から委譲されたメソッド
   * NOTE: https://developers.google.com/apps-script/reference/spreadsheet/sheet
   */
  getDataRange() { return this.sheet.getDataRange(); }
  getRange(...args) { return this.sheet.getRange(...args); }
  getLastRow() { return this.sheet.getLastRow(); }
  getLastColumn() { return this.sheet.getLastColumn(); }
  getFormUrl() { return this.sheet.getFormUrl(); }
  getName() { return this.sheet.getName(); }
  getParent() { return this.sheet.getParent(); }
  copy() { return new Sheet(this.sheet.copyTo(SS), this.headerRows, this.headerIndex); }

  /**
   * Sheet オブジェクトを新しく取得し直すメソッド
   * @return {Sheet} 更新された Sheet オブジェクト
   */
  flush() {
    SpreadsheetApp.flush();
    /** 元のオブジェクトのプロパティをリセットする場合 */
    // this.dataRangeValues_ = undefined;
    // this.headers_ = undefined
    // this.headerValues_ = undefined;
    // this.dataValues_ = undefined;
    // this.dicts_ = undefined;
    /** オブジェクトを新しく作る場合 */
    // const sheet = new Sheet(this.sheet, this.headerRows, this.headerIndex);
    // return sheet;
  }

  /**
   * シートの値すべて取得するメソッド
   * @return {Array.<Array.<number|string|boolean|Date>>} シートの値
   */
  getDataRangeValues() {
    if (this.dataRangeValues_ !== undefined) return this.dataRangeValues_;
    const dataRangeValues = this.getDataRange().getValues();
    this.dataRangeValues_ = dataRangeValues;
    return dataRangeValues;
  }

  /**
   * ヘッダーを取得するメソッド
   * @return {Array.<string>} ヘッダー一覧
   */
  getHeaders() {
    if (this.headers_ !== undefined) return this.headers_;
    const headerValues = this.getHeaderValues();
    const headers = headerValues[this.headerIndex];
    this.headers_ = headers;
    return headers;
  }

  /**
   * ヘッダー部分を取得するメソッド
   * @return {Array.<Array.<string>>} ヘッダー部分
   */
  getHeaderValues() {
    if (this.headerValues_ !== undefined) return this.headerValues_;
    const values = this.getDataRangeValues();
    const headerValues = values.filter((_, i) => i < this.headerRows);
    this.headerValues_ = headerValues;
    return headerValues;
  }

  /**
   * ヘッダー行を除いたレコード部分を取得するメソッド
   * @return {Array.<Array.<number|string|boolean|Date>>} レコード
   */
  getDataValues() {
    if (this.dataValues_ !== undefined) return this.dataValues_;
    const values = this.getDataRangeValues();
    const dataValues = values.filter((_, i) => i >= this.headerRows);
    this.dataValues_ = dataValues;
    return dataValues;
  }

  /**
   * ヘッダー情報から列番号を返すメソッド
   * @param {string} headerName - ヘッダー名
   * @return {number} 列番号
   */
  getColumnByHeaderName(headerName) {
    const columnIndex = this.getColumnIndexByHeaderName(headerName, this.headerIndex);
    const column = columnIndex + 1;
    return column;
  }

  /**
   * ヘッダー情報から列インデックスを返すメソッド
   * @param {string} headerName - ヘッダー名
   * @return {number} 列インデックス
   */
  getColumnIndexByHeaderName(headerName) {
    const headers = this.getHeaders(this.headerIndex);
    const columnIndex = headers.indexOf(headerName);
    if (columnIndex === -1) throw new Error('The value "' + headerName + '" does not exist in the header row of sheet "' + this.getName() + '".');
    return columnIndex;
  }

  /**
   * レコードをすべて削除し、値を貼り付けるメソッド
   * @param {Array.<Array.<number|string|boolean|Date>>} values - 貼り付ける値
   */
  setValuesHeaderRowsAfter(values) {
    this.clearDataValues();
    if (values.length === 0) return;
    this.getRange(this.headerRows + 1, 1, values.length, values[0].length).
      setValues(values);
    return this;
  }

  /**
   * レコードをすべて削除するメソッド
   */
  clearDataValues() {
    const values = this.getDataValues();
    if (values.length === 0) return;
    this.getRange(this.headerRows + 1, 1, values.length, values[0].length).
      clearContent();
    return this;
  }

  /**
   * 列の値をクリアするメソッド
   * @param {string} headerName - ヘッダー名
   * @return {Sheet} Sheet オブジェクト
   */
  clearField(headerName) {
    const column = this.getColumnByHeaderName(headerName);
    this.getRange(1 + this.headerRows, column, this.getLastRow() - this.headerRows).
      clearContent();
    return this;
  }

  /**
   * レコードの最終行の下に値を貼り付けるメソッド
   * @param {Array.<Array.<number|string|boolean|Date>>} values - 貼り付ける値
   */
  appendRows(values) {
    if (values.length === 0) return;
    this.getRange(this.getLastRow() + 1, 1, values.length, values[0].length).
      setValues(values);
    return this;
  }

  /**
   * レコード範囲でソートするメソッド
   * @param {number} column - ソート対象となる列
   * @param {boolean} ascending - 昇順か降順か
   */
  sortDataRows(column = 1, ascending = true) {
    this.getRange(this.headerRows + 1, 1, this.getLastRow() - this.headerRows, this.getLastColumn()).
      sort({ column: column, ascending: ascending });
    return this;
  }

  /**
   * 列に値が存在するかどうか返すメソッド
   * @param {string} headerName - 検索対象のヘッダー名
   * @param {number|string|boolean|Date} value - 検索対象の値
   * @return {boolean} 列に値が存在するかどうか
   */
  hasValueInField(headerName, value) {
    const fieldValues = this.getFieldValues(headerName);
    return fieldValues.includes(value);
  }

  /**
   * ヘッダー名から列の値を取得するメソッド
   * @param {string} headerName - ヘッダー名
   * @param {boolean} isAddHeader - ヘッダー名を配列に含むかどうか
   * @return {Array.<number|string|boolean|Date>} ヘッダー名に対する列の値
   */
  getFieldValues(headerName, isAddHeader = false) {
    const fieldValues = this.select([headerName], isAddHeader).flat();
    return fieldValues;
  }

  /**
   * ヘッダー情報の配列から必要な列だけの値を取得するメソッド
   * @param {Array.<string>} headerNames - 辞書のキーとなるヘッダー情報
   * @param {boolean} isAddHeaders - ヘッダー情報を配列に含むかどうか
   * @return {Array.<Array.<number|string|boolean|Date>>} ヘッダー情報に対応する列の値
   */
  select(headerNames, isAddHeaders = false) {
    const dicts = this.getAsDicts();
    const records = dicts.map(dict => headerNames.
      map(key => dict.get(key))
    );
    const values = isAddHeaders ? [headerNames, ...records] : records;
    return values;
  }

  /**
   * シートの値から、ヘッダー情報をプロパティとして持つ Map 型を生成するメソッド
   * @return {Array.<Map>} ヘッダー情報を key, 値を value として持つ Map オブジェクト
   */
  getAsDicts() {
    if (this.dicts_ !== undefined) return this.dicts_;
    const headers = this.getHeaders(this.headerIndex);
    const values = this.getDataValues();
    const dicts = values.map((record, i) => record.
      reduce((acc, cur, j) => acc.set(headers[j], cur), new Map([
        // ['row', i + this.headerRows + 1],  // 必要に応じて追加
        // ['record', record]  // 必要に応じて追加
      ]))
    );
    this.dicts_ = dicts;
    return dicts;
  }

  /**
   * フィルター対象の列に合致したレコードを取得するメソッド
   * @param {string} headerName - フィルター対象の列のヘッダー名
   * @param {string|number|boolean|Date} value - フィルター対象の値
   * @return {Array.<Array.<string|number|boolean|Date>} フィルターされたレコード
   */
  filterRecords(headerName, value) {
    const filteredDicts = this.filterDicts(headerName, value, this.headerIndex);
    const records = filteredDicts.map(dict => dict.get('record'));
    return records;
  }

  /**
   * フィルター対象の列に合致した dicts を取得するメソッド
   * @param {string} headerName - フィルター対象の列のヘッダー名
   * @param {string|number|boolean|Date} value - フィルター対象の値
   * @param {boolean} isSameValue - 値が同一のものをフィルタするかどうか。false の場合は同一でないものをフィルタする
   * @return {Array.<Map>} フィルターされた dicts
   */
  filterDicts(headerName, value, isSameValue = true) {
    const dicts = this.getAsDicts();
    const filteredDicts = isSameValue ?
      dicts.filter(dict => dict.get(headerName) === value) :
      dicts.filter(dict => dict.get(headerName) !== value);
    return filteredDicts;
  }

  /**
   * フィルター対象の列に値がある dicts を取得するメソッド
   * @param {string} header - フィルター対象の列のヘッダー名
   * @param {string|number|boolean|Date} value - フィルター対象の値
   * @return {Array.<Map>} フィルターされた dicts
   */
  filterDictsWithValue(header) {
    const dicts = this.getAsDicts();
    const filterdDicts = dicts.filter(dict => dict.get(header) !== '');
    return filterdDicts;
  }

  /**
   * 抽出対象の列の一番最初に合致したレコードを取得するメソッド
   * @param {string} header - 抽出対象の列のヘッダー名
   * @param {string|number|boolean|Date} value - 抽出対象の値
   * @return {Array.<string|number|boolean|Date>} 対象レコード
   */
  findRecord(header, value) {
    const dict = this.findDict(header, value, this.headerIndex);
    const record = dict === undefined ? null : dict.get('record');
    return record;
  }

  /**
   * 抽出対象の列の一番最初に合致した dict を取得するメソッド
   * @param {string} headerName - 抽出対象の列のヘッダー名
   * @param {string|number|boolean|Date} value - 抽出対象の値
   * @return {Map} dict
   */
  findDict(headerName, value) {
    const dicts = this.getAsDicts();
    const dict = dicts.find(dict => dict.get(headerName) === value);
    if (dict === undefined) throw new Error('The value "' + value + '" does not exist in the "' + headerName + '" column of sheet' + this.getName() + '.');
    return dict;
  }

  /**
   * シートの文字列を一括置換するメソッド
   * @param {string} string - 置換対象の文字列
   * @param {string} replaced - 置換後の文字列
   * @return {Sheet} 文字列置換後の Sheet オブジェクト
   */
  replaceAllText(string, replaced) {
    console.log(string, replaced);
    const textFinder = this.sheet.createTextFinder(string);
    textFinder.replaceAllWith(after);
    return this;
  }

  /**
   * シートに回答するフォーム オブジェクトを取得するメソッド
   * @return {FormApp.Form} シートに回答するフォーム オブジェクト
   */
  getAssociatedForm() {
    const url = this.getAssociatedFormUrl();
    const form = FormApp.openByUrl(url);
    return form;
  }

  /**
   * アクティブなシートを移動させるメソッド
   * @param {number} pos -  
   */
  move(pos = 1) {
    this.activate();
    return SS.moveActiveSheet(pos);
  }

  /**
   * Sheet オブジェクトから xlsx 形式の Excel ファイルを作成するメソッド
   * @param {string} folerdId - 出力先の Google ドライブ フォルダ ID
   */
  exportToExcel(xlsxName = EXCEL_INFO.NAME, folerdId = EXCEL_INFO.DRIVE.URL) {
    this.flush();
    const url = 'https://docs.google.com/feeds/download/spreadsheets/Export?key=' + this.getParentId() + '&amp;exportFormat=xlsx';
    const params = {
      headers: {
        Authorization: 'Bearer ' + ScriptApp.getOAuthToken()
      },
      muteHttpExceptions: true
    };
    const blob = UrlFetchApp.fetch(url, params).getBlob().setName(xlsxName);
    DriveApp.getFolderById(folerdId).createFile(blob);
  }

  /**
   * シートの親スプレッドシートの ID を取得するメソッド
   * @return {string} スプレッドシートの ID
   */
  getParentId() {
    const parent = this.getParent();
    const parentId = parent.getId();
    return parentId;
  }

  /**
   * URL からシートを取得する静的メソッド
   * @param {string} url - シート ID を含むスプレッドシートの URL
   */
  static getByUrl(url) {
    const sheets = SpreadsheetApp.openByUrl(url).getSheets();
    const sheetId = Number(url.split('#gid=')[1]);
    const sheet = sheets.find(sheet => sheet.getSheetId() === sheetId);
    return sheet;
  }

}