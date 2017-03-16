import {Base64} from 'js-base64';
import req from 'request-promise';
import debug from 'debug';
import $ from 'jquery';

const log = debug('github');

/**
 * Github Constants
 */
export const GITHUB_ISSUE = 'issues';
export const GITHUB_PULL_REQUEST = 'pulls';
export const GITHUB_REPOSITORY = 'repos';

/**
 * Make simple API calls to the Github API.
 */
class Github {
  /**
   * Either a username and password or an oauth token for Github.
   * @typedef {Object} Github.auth
   * @prop {string} [username]
   *  The Github username.
   * @prop {string} [password]
   *  The user's password.
   * @prop {token} [token]
   *  An OAuth token.
   */

  /**
   * Initialize our Github API.
   *
   * @param {Github.auth} [auth]
   *  The credentials used to authenticate with Github. If not provided
   *  requests will be made unauthenticated.
   */
  constructor(auth) {
    this._base = 'https://api.github.com/';
    this._auth = {
      token: auth.token,
      username: auth.username,
      password: auth.password,
    };

    if (auth.token) {
      this._auth.header = 'token ' + auth.token;
    } else if (auth.username && auth.password) {
      this._auth.header= 'Basic ' + Base64.encode(auth.username + ':' + auth.password);
    }
  }

  /**
   * Get the headers required for an API request.
   *
   * @return {Object}
   *  The headers to pass to the request.
   */
  _getRequestHeaders() {
    let headers = {
      'Content-Type': 'application/json;charset=UTF-8',
      'Accept': 'application/vnd.github.v3+json',
    };

    if (this._auth.header) {
      headers.Authorization = this._auth.header;
    }

    return headers;
  }

  /**
   * Sets the default options for API requests
   *
   * @return {Object}
   *  Additional options to pass to the request.
   */
  _getRequestOptions(options) {
    options = Object.assign({
      sort: 'updated',
      per_page: '5000',
    }, options);

    return options;
  }

  /**
   * Returns the relevant Github schema objects for a given type.
   *
   * @param {string} type
   *  The object type of the Github request.
   *
   * @return {Array}
   *  Array of schema promises.
   */
  static getSchema(type) {
    let promises = [];

    switch (type) {
      case GITHUB_ISSUE:
        promises.push(...[
          Promise.resolve($.getJSON('/build/assets/schema/repos.json')),
          Promise.resolve($.getJSON('/build/assets/schema/issues.json')),
          Promise.resolve($.getJSON('/build/assets/schema/comments.json'))]);
        break;
      case GITHUB_PULL_REQUEST:
        promises.push(...[
          Promise.resolve($.getJSON('/build/assets/schema/repos.json')),
          Promise.resolve($.getJSON('/build/assets/schema/comments.json'))]);
        break;
      case GITHUB_REPOSITORY:
        promises.push(...[
          Promise.resolve($.getJSON('/build/assets/schema/repos.json')),
          Promise.resolve($.getJSON('/build/assets/schema/issues.json'))]);
        break;
      default:
        break;
    }

    return promises;
  }

  /**
   * Make a request to Github to fetch the ratelimit(s).
   *
   * @return {Promise)
   *  The Promise for the rate limit request.
   */
  getRateLimit() {
    const url = this._base + 'rate_limit';
    return this.request(url);
  }

  /**
   * Make a request and fetch all available data (support pagination).
   *
   * @param {string} [url]
   *  The url for the API request.
   * @param {*} [options]
   *  Additional options will be sent as query parameters.
   * @param {Object[]} [results]
   *  For internal use only - recursive requests.
   *
   * @return {Promise}
   *  The Promise for the http request
   */
  request(url, options = {}, results = []) {
    const config = {
      url: url,
      method: 'GET',
      headers: this._getRequestHeaders(),
      params: this._getRequestOptions(options),
      responseType: 'json',
      resolveWithFullResponse: true,
      json: true,
    };

    return req(config).then((response) => {
      let data;

      if (response.body instanceof Array) {
        // Default GET Github API requests.
        data = response.body;
      }
      else if (response.body.items instanceof Array) {
        // Support SEARCH Github API requests.
        // @link https://developer.github.com/v3/search/
        data = response.body.items;
      }
      else {
        // Reject.
        log('reject');
      }

      // Push our data onto the results.
      results.push(...data);

      // Support Github pagination.
      const nextPage = getNextPage(response.headers.link);
      if (nextPage) {
        return this.request(nextPage, options, results);
      }

      return results;
    }).catch(function (err) {
      log(err);
    });
  }
}

module.exports = Github;

// Private helper functions.

/**
 * Gets a url to the next page of the result set.
 *
 * @param {string} link
 *  The meta data 'link' from our response header.
 * @returns {*}
 *  The url to our next page, or undefined if no next page was found.
 */
function getNextPage(link) {
  let links = {};

  link.replace(/<([^>]*)>;\s*rel="([\w]*)\"/g, function(m, uri, type) {
    links[type] = uri;
  });

  return links.next;
}
