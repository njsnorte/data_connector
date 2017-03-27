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
   * @param {Array} [data]
   *  An array of pull requests to process.
   * @returns {Promise}
   */
  processData(data) {
    let processedData = {
      'assignees': [],
      'pulls': [],
      'milestones': [],
      'users': [],
    };

    return new Promise((resolve, reject) => {
      // Isolate objects and arrays to make joins easier in Tableau.
      _.forEach(data, (obj) => {
        // Assignees.
        if (_.has(obj, 'assignees') && obj.assignees.length > 0) {
          _.forEach(obj.assignees, (assignee) => {
            if(!_.find(processedData.users, {id: assignee.id})) {
              ['users'].push(assignee);
            }

            processedData['assignees'].push({
              'parent_id': obj.id,
              'user_id': assignee.id,
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

            if(!_.find(processedData.users, {id: milestone.user_id})) {
              processedData['users'].push(user);
            }
          }

          if(!_.find(processedData.milestones, {id: milestone.id})) {
            processedData['milestones'].push(milestone);
          }
        }

        // Users.
        if (_.has(obj, 'user') && obj.user) {
          let user = obj.user;
          obj.user_id = user.id;

          if(!_.find(processedData.users, {id: user.id})) {
            processedData['users'].push(user);
          }
        }

        // Pull request data.
        if(!_.find(processedData.pulls, {id: obj.id})) {
          processedData.pulls.push(obj);
        }
      });

      resolve(processedData);
    });
  }

}

export default Pulls;


// Private helper functions.
