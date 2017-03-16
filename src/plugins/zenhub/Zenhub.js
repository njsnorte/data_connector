import req from 'request-promise';
import debug from 'debug';

const log = debug('zenhub');

/**
 * Make simple API calls to the Zenhub API.
 */
class Zenhub {

  /**
   * Initialize our Zenhub API.
   *
   * @param {token} [token]
   *  The oauth token used to authenticate with Zenhub.
   */
  constructor(token) {
    this._token = token;
    this._headers = {
      'X-Authentication-Token': this._token
    };
  }

  /**
   * Make a request and fetch all available data (support pagination).
   *
   * @param {string} [url]
   *  The url for the API request.
   * @param {*} [options]
   *  Additional options will be sent as query parameters.
   *  @todo Placeholder for future support.
   * @param {Object[]} [results]
   *  For internal use only - recursive requests.
   *
   * @return {Promise} - The Promise for the http request
   */
  request(url, options = {}, results = []) {
    const config = {
      url: url,
      method: 'GET',
      headers: this._headers,
      params: options,
      responseType: 'json',
      resolveWithFullResponse: true,
      json: true,
    };

    return req(config).then((response) => {
      let data;

      if (response.body instanceof Array) {
        // Default GET Zenhub API requests.
        data = response.body;
      }
      else {
        // Reject.
        log('reject');
      }

      // Push our data onto the results.
      results.push(...data);

      return results;
    }).catch(function (err) {
      log(err);
    });
  }
}

module.exports = Zenhub;

// Private helper functions.
