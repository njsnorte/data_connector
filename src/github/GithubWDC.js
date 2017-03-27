"use strict";

import Github from './components/Github';
import PromisePool from 'es6-promise-pool';
import _ from 'lodash';

/**
 * Wrapper around the Tableau WDC for using the Github API.
 */
class GithubWDC {

  constructor() {
    this._cache = {
      'assigned_labels': [],
      'assignees': [],
      'issues': [],
      'labels': [],
      'milestones': [],
      'users': [],
    };
    this._ghApi = {};
    this._gh = {};
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
    const accessToken = Cookies.get("accessToken"),
      isAuthenticated = (accessToken && accessToken.length > 0) || tableau.password.length > 0;

    // Set the authentication method to custom.
    tableau.authType = tableau.authTypeEnum.custom;

    // Modify UI.
    updateUI(isAuthenticated);

    cb();

    switch (tableau.phase) {
      case tableau.phaseEnum.auth:
        if (isAuthenticated) {
          tableau.password = accessToken;

          // Auto-submit.
          tableau.submit()
        }
        break;
      case tableau.phaseEnum.interactivePhase:
        if (isAuthenticated) {
          tableau.password = accessToken;
        }
        break;
    }
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
    this._gh.getSchema().then((schema) => {
      cb(schema['tables'], schema['joins']);
    });
  }

  /**
   * Runs the main API request given the query and caches its results.
   *
   * @returns {Promise}
   * @private
   */
  _preFetch() {
    // Don't run the query multiple times.
    if (this._preFetched) {
      return Promise.resolve(false);
    }
    else {
      const query = this._getConnectionData('query'),
        urls = parseQuery(query);

      // Set our flag to true to ensure we don't run this twice.
      this._preFetched = true;

      return this._getData(urls, 5);
    }
  }

  /**
   * Concurrently runs API requests for a number of given urls.
   *
   * @param {array}(urls)
   *  A list of urls to call using the API.
   * @param {number}(concurrency)
   *  The number of concurrent API calls we can make.
   *
   * @returns {Promise}
   * @private
   */
  _getData(urls, concurrency = 3) {
    return new Promise((resolve, reject) => {
      let count = 0,
        producer,
        pool,
        raw = [];

      // A Promise Pool producer generates promises as long as there is work left
      // to be done. We return null to notify the pool is empty.
      producer = () => {
        if (count < urls.length) {
          let url = urls[count];
          count++;

          // The actual API request for a given url.
          return new Promise((resolve, reject) => {
            this._gh.request(url).then((result) => {
              raw = raw.concat(...result);

              resolve(raw);
            });
          });
        }
        else {
          return null;
        }
      };

      // Run our promises concurrently, but never exceeds the maximum number of
      // concurrent promises (i.e. concurrency).
      pool = new PromisePool(producer, concurrency);
      pool.start().then(() => {
        resolve(raw);
      });
    });
  }

  /**
   * Process our issues into a format that is more Tableau friendly.
   * Isolate nested objects and arrays (e.g. user, assignees, labels and milestone)
   * and store them in separate 'tables'.
   *
   * @param {string} [tableId]
   *  The table id for which we are parsing the data.
   * @param {Array} [data]
   *  An array of issues to process.
   * @returns {Promise}
   */
  _processData(tableId, data) {
    return new Promise((resolve, reject) => {
      // Isolate objects and arrays to make joins easier in Tableau.
      _.forEach(data, (obj) => {
        // Assignees.
        if (_.has(obj, 'assignees') && obj.assignees.length > 0) {
          _.forEach(obj.assignees, (assignee) => {
            if(!_.find(this._cache.users, {id: assignee.id})) {
              this._cache['users'].push(assignee);
            }

            this._cache['assignees'].push({
              'parent_id': obj.id,
              'user_id': assignee.id,
            });
          });
        }

        // Labels.
        if (_.has(obj, 'labels') && obj.labels.length > 0) {
          _.forEach(obj.labels, (label) => {
            if(!_.find(this._cache.labels, {id: label.id})) {
              this._cache['labels'].push(label);
            }

            this._cache['assigned_labels'].push({
              'parent_id': obj.id,
              'label_id': label.id,
            });
          });
        }

        // Milestones.
        if (_.has(obj, 'milestone') && obj.milestone) {
          let milestone = obj.milestone;
          obj.milestone_id = milestone.id;

          // Handle milestone creators.
          if (_.has(milestone, 'creator') && milestone.creator) {
            let user = milestone.creator;
            milestone.user_id = user.id;

            if(!_.find(this._cache.users, {id: milestone.user_id})) {
              this._cache['users'].push(user);
            }
          }

          if(!_.find(this._cache.milestones, {id: milestone.id})) {
            this._cache['milestones'].push(milestone);
          }
        }

        // Users.
        if (_.has(obj, 'user') && obj.user) {
          let user = obj.user;
          obj.user_id = user.id;

          if(!_.find(this._cache.users, {id: user.id})) {
            this._cache['users'].push(user);
          }
        }

        // Main obj.
        if(!_.find(this._cache[tableId], {id: obj.id})) {
          this._cache[tableId].push(obj);
        }
      });

      resolve(this._cache[tableId]);
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

    this._preFetch().then((rawData) => {
      if (rawData) {
        return this._processData(tableId, rawData);
      }
      else {
        return this._cache[tableId];
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
