"use strict";

import Github from './core/Github';
import Zenhub from './plugins/zenhub/Zenhub';
import _ from 'lodash';

/**
 * Wrapper around the Tableau WDC for using the Github API.
 */
class GithubWDC {

  constructor() {
    this._cache = {};
    this._ghApi = {};
    this._gh = {};
    this._zhApi = {};
    this._requestType = null;
    this._preFetched = false;
  }

  /**
   * Implements Tableau WDC init().
   *
   * @param {function} [cb]
   *  Callback function.
   */
  init(cb) {
    cb();
  }

  /**
   * Returns the authentication for Github.
   *
   * @returns {{username: *, password: *, token: *}}
   * @private
   */
  _getAuthentication() {
    return {
      username: tableau.username,
      password: tableau.password,
      token: tableau.password,
    };
  }

  /**
   * Return the connection data, or a specific property from, of the Tableau
   * WDC connection data.
   *
   * @param {string} [prop]
   *  Optional property name to retrieve the value for.
   * @private
   */
  _getConnectionData(prop = null) {
    const connectionData = JSON.parse(tableau.connectionData);

    if (prop && _.has(connectionData, prop)) {
      return connectionData[prop];
    }
    else {
      return connectionData;
    }
  }

  /**
   * Implements Tableau WDC getSchema().
   *
   * @param {function}[cb]
   *  Callback function.
   */
  getSchema(cb) {
    this._requestType = this._getConnectionData('dataType');

    // Initialize our Github API.
    this._ghApi = new Github(this._getAuthentication());

    switch (this._requestType) {
      case Github.ISSUE:
        this._gh = this._ghApi.getIssues();
        break;
      case Github.PULL_REQUEST:
        this._gh = this._ghApi.getPulls();
        break;
    }

    // Add schema objects to array of promises.
    Promise.all(this._gh.getSchema()).then(cb);
  }

  /**
   * Runs the main API request given the query and caches its results.
   *
   * @returns {Promise}
   * @private
   */
  _preFetch() {
    return new Promise((resolve, reject) => {
      // Don't run the query multiple times.
      if (this._preFetched) {
        resolve();
      }

      const query = this._getConnectionData('query'),
        urls = parseQuery(query);
      let promises = [],
        raw = [];

      for(const url of urls) {
        promises.push(this._gh.request(url));
      }

      return Promise.all(promises).then((result) => {
        raw = raw.concat(...result);

        this._gh.processData(raw).then((processedData) => {
          // Cache our processed data.
          this._cache = processedData;

          // Set our flag to true to ensure we don't run this twice.
          this._preFetched = true;

          resolve();
        });
      });
    });
  }

  /**
   * Implements Tableau WDC getData().
   *
   * @param table
   * @param {function} [cb]
   *  Callback function.
   */
  getData(table, cb) {
    const tableId = table.tableInfo.id;

    this._preFetch().then(() => {
      // Make additional API calls for comments and epics.
      if (tableId === 'comments') {
        const issueIds = _.map(this._cache[tableId], 'comments_url');
        console.log(issueIds);
      }
      else {
        return Promise.resolve(this._cache[tableId]);
      }
    }).then((tableData) => {
      // Append the data to the table and hand it back to Tableau.
      table.appendRows(tableData);

      cb();
    });
  }

  /**
   * Implements Tableau WDC shutdown().
   *
   * @param cb
   */
  shutdown(cb) {
    cb();
  }

}

module.exports = GithubWDC;

// Private helper functions.

/**
 * Parse query into useful API request urls.
 *
 * @param {string} [query]
 *  Query string to the API base.
 * @return {Array}
 *  Array of urls.
 */
function parseQuery(query) {
  const base = 'https://api.github.com/',
    re = /\[(.*)\]/g,
    match = re.exec(query);
  let urls = [];

  // Look for any arrays in our query string.
  if (match !== null) {
    const delimited = match[1].split(',');

    for(const value of delimited) {
      urls.push(base + query.replace(re, value));
    }
  } else {
    urls.push(base + query);
  }

  return urls;
}
