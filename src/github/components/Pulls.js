import GithubObject from './GithubObject';
import $ from 'jquery';
import _ from 'lodash';
import debug from 'debug';

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
    const schema = {
      'tables': [],
      'joins': [],
    };

    return new Promise((resolve, reject) => {
      const tablePromises = [
          Promise.resolve($.getJSON('/github/schema/pulls.json')),
          Promise.resolve($.getJSON('/github/schema/milestones.json')),
          Promise.resolve($.getJSON('/github/schema/repos.json')),
          Promise.resolve($.getJSON('/github/schema/users.json'))],
        joinPromises = [
          Promise.resolve($.getJSON('/github/schema/_pulls_joins.json')),
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

  /**
   * Process our pull requests into a format that is more Tableau friendly.
   * Isolate nested objects and arrays (e.g. user, assignees and milestone)
   * and store them in separate 'tables'.
   *
   * @param {Object} [result]
   *  An object where you wish to save the processed data onto.
   * @param {string} [tableId]
   *  The identifier of the table that is being requested.
   * @param {Array} [rawData]
   *  An array of objects to process.
   * @returns {Promise}
   */
  processData(result, tableId, rawData) {
    result = _.assignIn(result, {
      'assignees': [],
      'pulls': [],
      'milestones': [],
      'users': [],
    });

    return new Promise((resolve, reject) => {
      // Isolate objects and arrays to make joins easier in Tableau.
      _.forEach(rawData, (obj) => {
        // Assignees.
        if (_.has(obj, 'assignees') && obj.assignees.length > 0) {
          _.forEach(obj.assignees, (assignee) => {
            if(!_.find(result.users, {id: assignee.id})) {
              ['users'].push(assignee);
            }

            result['assignees'].push({
              'parent_id': obj.id,
              'user_id': assignee.id,
            });
          });
        }

        // Milestones.
        if (_.has(obj, 'milestone') && obj.milestone) {
          const milestone = obj.milestone;
          obj.milestone_id = milestone.id;

          // Handle milestone creators.
          if (_.has(milestone, 'creator') && milestone.creator) {
            const user = milestone.creator;
            milestone.user_id = user.id;

            if(!_.find(result.users, {id: milestone.user_id})) {
              result['users'].push(user);
            }
          }

          if(!_.find(result.milestones, {id: milestone.id})) {
            result['milestones'].push(milestone);
          }
        }

        // Users.
        if (_.has(obj, 'user') && obj.user) {
          const user = obj.user;
          obj.user_id = user.id;

          if(!_.find(result.users, {id: user.id})) {
            result['users'].push(user);
          }
        }

        // Pull request data.
        if(!_.find(result.pulls, {id: obj.id})) {
          result.pulls.push(obj);
        }
      });

      resolve(result);
    });
  }

}

export default Pulls;


// Private helper functions.
