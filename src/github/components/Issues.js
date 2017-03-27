import GithubObject from './GithubObject';
import debug from 'debug';
import $ from 'jquery';
import _ from 'lodash';

const log = debug('issues');

/**
 * Make simple API calls to the Github API.
 */
class Issues extends GithubObject {

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
   * Returns the relevant Github schema objects for issues.
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
        Promise.resolve($.getJSON('/github/schema/issues.json')),
        Promise.resolve($.getJSON('/github/schema/users.json')),
        Promise.resolve($.getJSON('/github/schema/milestones.json')),
        Promise.resolve($.getJSON('/github/schema/assignees.json')),
        Promise.resolve($.getJSON('/github/schema/labels.json')),
        Promise.resolve($.getJSON('/github/schema/assigned_labels.json'))],
        joinPromises = Promise.resolve($.getJSON('/github/schema/_joins.json'));

      Promise.all(tablePromises).then((tables) => {
        schema.tables = tables;

        return joinPromises;
      }).then((joins) => {
        schema.joins = joins;

        resolve(schema);
      });
    });
  }

}

export default Issues;


// Private helper functions.
