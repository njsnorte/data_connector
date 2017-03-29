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
    const schema = {
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
        joinPromises = Promise.resolve($.getJSON('/github/schema/_issues_joins.json'));

      Promise.all(tablePromises).then((tables) => {
        schema.tables = tables;

        return joinPromises;
      }).then((joins) => {
        schema.joins = joins;

        resolve(schema);
      });
    });
  }

  /**
   * Process our issues into a format that is more Tableau friendly.
   * Isolate nested objects and arrays (e.g. user, assignees, labels and milestone)
   * and store them in separate 'tables'.
   *
   * @param {Array} [data]
   *  An array of issues to process.
   * @returns {Promise}
   */
  processData(data) {
    const processedData = {
      'assigned_labels': [],
      'assignees': [],
      'issues': [],
      'labels': [],
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

        // Labels.
        if (_.has(obj, 'labels') && obj.labels.length > 0) {
          _.forEach(obj.labels, (label) => {
            if(!_.find(processedData.labels, {id: label.id})) {
              processedData['labels'].push(label);
            }

            processedData['assigned_labels'].push({
              'parent_id': obj.id,
              'label_id': label.id,
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
          const user = obj.user;
          obj.user_id = user.id;

          if(!_.find(processedData.users, {id: user.id})) {
            processedData['users'].push(user);
          }
        }

        // Issue data.
        if(!_.find(processedData.issues, {id: obj.id})) {
          // Add repository information.
          if (_.has(obj, 'repository_url')) {
            obj.repo_name = obj.repository_url
              .substr(obj.repository_url
              .lastIndexOf('/') + 1);
          }

          // Distinguish issues from pull requests.
          obj.is_pull_request = _.has(obj, 'pull_request');

          processedData.issues.push(obj);
        }
      });

      resolve(processedData);
    });
  }

}

export default Issues;


// Private helper functions.
