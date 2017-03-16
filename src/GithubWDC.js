"use strict";

import Github from './Github';
import Zenhub from './plugins/zenhub/Zenhub';

/**
 * Wrapper around the Tableau WDC for using the Github API.
 */
class GithubWDC {

  constructor() {
    // Cache the data from the API call(s).
    this._cache = {};
    this._preFetched = false;
  }

  init(cb) {
    cb();
  }

  _getAuthentication() {
    return {
      username: tableau.username,
      password: tableau.password,
      token: tableau.password,
    };
  }

  _getConnectionData(prop = null) {
    const connectionData = JSON.parse(tableau.connectionData);

    if (prop && connectionData.hasOwnProperty(prop)) {
      return connectionData[prop];
    }
    else {
      return connectionData;
    }
  }

  getSchema(cb) {
    let type = this._getConnectionData('dataType');

    // Add schema objects to array of promises.
    Promise.all(Github.getSchema(type)).then(cb);
  }

  _preFetchData() {
    const gh = new Github(this._getAuthentication()),
      query = this._getConnectionData('query'),
      urls = parseQuery(query);
    let promises = [],
      raw = [];

    for(const url of urls) {
      promises.push(gh.request(url));
    }

    Promise.all(promises).then((result) => {
      raw = raw.concat(...result);
    });

    // Add our raw results to the cache.
    this._cache['raw'] = raw;
  }

  getData(table, cb) {
    const tableId = table.tableInfo.id;

    // Only perform the initial API request once!
    if (!this._preFetched) {
      this._preFetchData();
    }

    // Post-process data.
    let processedData = this.processData(table);

    // Store our parsed results.
    this._data[tableId] = processedData;

    // Append the data to the table and hand it back to Tableau.
    table.appendRows(processedData);
    cb();
  }

  _processData(table, data) {
    return data;
  }

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
