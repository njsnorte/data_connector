import GithubObject from './GithubObject';
import debug from 'debug';
import $ from 'jquery';
import _ from 'lodash';

const log = debug('pulls');

/**
 * Make simple API calls to the Github API.
 */
class Pulls extends GithubObject {

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
    super(auth, base);
  }

  /**
   * Returns the relevant Github schema objects for pulls.
   *
   * @return {Array}
   *  Array of schema promises.
   */
   getSchema() {
    return [
      Promise.resolve($.getJSON('/build/assets/schema/pulls.json')),
      Promise.resolve($.getJSON('/build/assets/schema/comments.json')),
      Promise.resolve($.getJSON('/build/assets/schema/labels.json'))
    ];
  }

  /**
   * Process our pull requests into a format that is more Tableau friendly.
   * Isolate nested objects and arrays (e.g. user, assignees, labels and milestone)
   * and store them in separate 'tables'.
   *
   * @param {array} data
   *  An array of issues to process.
   * @returns {*}
   */
  processData(data) {
    return data;
  }

}

export default Pulls;


// Private helper functions.
