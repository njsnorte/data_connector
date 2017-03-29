import {Base64} from 'js-base64';
import req from 'request-promise';
import debug from 'debug';

const log = debug('github');

/**
 * Make simple API calls to the Github API.
 */
class GithubObject {
  /**
   * Either a username and password or an oauth token for Github.
   * @typedef {Object} GithubObject.auth
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
   * @param {string} [base]
   *  The base of the API url.
   */
  constructor(auth, base) {
    this._base = base;
    this._auth = auth;

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
    const headers = {
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
   * @return {Promise}
   *  Promise of schema object.
   */
  getSchema() {
    throw new Error('You have to implement this abstract method!');
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
      qs: this._getRequestOptions(options),
      responseType: 'json',
      resolveWithFullResponse: true,
      json: true,
    };

    return req(config).then((response) => {
      if (response.body instanceof Array) {
        // Default GET Github API requests.
        results.push(...response.body);
      }
      else if (response.body instanceof Object) {
        // Default single GET Github API requests.
        results.push(response.body);
      }
      else if (response.body.items instanceof Array) {
        // Support SEARCH Github API requests.
        // @link https://developer.github.com/v3/search/
        results.push(...response.body.items);
      }
      else {
        log('reject');
      }

      // Support Github pagination.
      if (response.headers.link) {
        const nextPage = getNextPage(response.headers.link);
        if (nextPage) {
          return this.request(nextPage, options, results);
        }
      }

      return results;
    }).catch(function (err) {
      log(err);
    });
  }

  /**
   * Process our objects into a format that is more Tableau friendly.
   * Isolate nested objects and arrays and store them in separate 'tables'.
   *
   * @param {Array} [data]
   *  An array of objects to process.
   * @returns {Promise}
   */
  processData(data) {
    return data;
  }

}

export default GithubObject;


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
  const links = {};

  link.replace(/<([^>]*)>;\s*rel="([\w]*)\"/g, function(m, uri, type) {
    links[type] = uri;
  });

  return links.next;
}
