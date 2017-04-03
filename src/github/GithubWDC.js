"use strict";

import Github from './components/Github';
import PromisePool from 'es6-promise-pool';
import _ from 'lodash';

/**
 * Wrapper around the Tableau WDC for using the Github API.
 */
class GithubWDC {

  constructor() {
    this._cache = {};
    this._ghApi = {};
    this._gh = {};
    this._requestType = null;
    this._preFetched = false;
  }

  get cache() {
    return this._cache;
  }

  set cache(cache) {
    this._cache = cache;
  }

  /**
   * Implements Tableau WDC init().
   *
   * @param {function} [cb]
   *  Callback function.
   */
  init(cb) {
    const accessToken = Cookies.get("accessToken") || false,
      hasAccessToken = (accessToken && accessToken !== 'undefined' && accessToken.length > 0) ||
        tableau.password.length > 0;

    // Set the authentication method to custom.
    tableau.authType = tableau.authTypeEnum.custom;

    if (tableau.phase === tableau.phaseEnum.gatherDataPhase) {
      // Initialize our Github API.
      this._ghApi = new Github(this._getAuthentication());

      // Validate access token.
      this._ghApi.getRateLimit().catch((err) => {
        tableau.log("Invalid accessToken.");
        tableau.abortForAuth();
      });
    }

    // Update the UI to reflect the authentication status.
    $(document).trigger('updateUI', hasAccessToken);

    cb();

    switch (tableau.phase) {
      case tableau.phaseEnum.authPhase:
        if (hasAccessToken) {
          tableau.password = accessToken;
          // Auto-submit.
          tableau.submit();
        }
        break;
      case tableau.phaseEnum.interactivePhase:
        if (hasAccessToken) {
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
   */
  getConnectionData(prop = null) {
    const connectionData = JSON.parse(tableau.connectionData || "{}");

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
    this._requestType = this.getConnectionData('dataType');

    switch (this._requestType) {
      case Github.ISSUE:
        this._gh = this._ghApi.getIssues();
        break;
      case Github.PULL_REQUEST:
        this._gh = this._ghApi.getPulls();
        break;
      case Github.TRAFFIC:
        this._gh = this._ghApi.getTraffic();
        break;
    }

    // Add schema objects to array of promises.
    this._gh.getSchema().then((schema) => {
      cb(schema['tables'], schema['joins']);
    });
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
  _request(urls, concurrency = 5) {
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
              // Append all our raw data.
              raw = raw.concat(...result);

              resolve(raw);
            }).catch((err) => {
              reject('Invalid Github API request: ' + url);
            });
          });
        }
        else {
          return null;
        }
      };

      // Run our promises concurrently, but never exceeds the maximum number of
      // concurrent promises.
      pool = new PromisePool(producer, concurrency);
      pool.start().then(() => {
        resolve(raw);
      }, (err) => {
        tableau.abortWithError(err);
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

    if(_.has(this._cache, tableId)) {
      table.appendRows(this._cache[tableId]);
      cb();
    }
    else {
      const query = this.getConnectionData('query'),
        urls = this._gh.parseQuery(query, tableId);

      this
        ._request(urls, 5)
        .then((rawData) => {
          console.log(rawData);
          return this._gh.processData(this._cache, tableId, rawData);
        }).then((processedData) => {
          console.log(processedData);
          this._cache = processedData;
          return Promise.resolve(true);
        }).then(() => {
          table.appendRows(this._cache[tableId]);
          cb();
        }).catch((err) => {
          reject(err);
        });
    }
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
