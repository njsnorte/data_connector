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
   * Returns the relevant Github schema objects for pull requests.
   *
   * @return {Promise}
   *  Promise of schema object.
   */
  getSchema() {
    let schema = {
      'tables': [],
      'joins': [],
    };

    return new Promise((resolve, reject) => {
      const tablePromises = [
          Promise.resolve($.getJSON('/build/assets/schema/pulls.json')),
          Promise.resolve($.getJSON('/build/assets/schema/comments.json')),
          Promise.resolve($.getJSON('/build/assets/schema/labels.json'))],
        joinPromises = [
          Promise.resolve($.getJSON('/build/assets/schema/_joins.json')),
        ];

      Promise.all(tablePromises).then((tables) => {
        schema.tables = tables;

        return Promise.all(joinPromises);
      }).then((joins) => {
        schema.joins = joins;

        resolve(schema);
      });
    });
  }

}

export default Pulls;


// Private helper functions.
