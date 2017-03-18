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
        Promise.resolve($.getJSON('/build/assets/schema/issues.json')),
        Promise.resolve($.getJSON('/build/assets/schema/comments.json')),
        Promise.resolve($.getJSON('/build/assets/schema/labels.json')),
        Promise.resolve($.getJSON('/build/assets/schema/assigned_labels.json'))],
        joinPromises = Promise.resolve($.getJSON('/build/assets/schema/_joins.json'));

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
    let processedData = {
      'assigned_labels': [],
      'assignees': [],
      'comments': [],
      'issues': data,
      'labels': [],
      'milestones': [],
      'users': [],
    };

    return new Promise((resolve, reject) => {
      // Isolate objects and arrays to make joins easier in Tableau.
      _.forEach(data, (obj) => {
        // Assignees
        if (_.has(obj, 'assignees') && obj.assignees.length > 0) {
          _.forEach(obj.assignees, (assignee) => {
            if(!_.find(processedData.users, {id: assignee.id})) {
              processedData['users'].push(assignee);
            }

            processedData['assignees'].push({
              'parent_id': obj.id,
              'user_id': assignee.id,
            });
          });
        }

        // Comments
        if (_.has(obj, 'comments') && parseInt(obj.comments) > 0) {
          processedData['comments'].push({
            'parent_id': obj.id,
            'comments_url': obj.comments_url,
          });
        }

        // Labels
        if (_.has(obj, 'labels') && obj.labels.length > 0) {
          _.forEach(obj.labels, (label) => {
            if(!_.find(processedData.labels, {id: label.id})) {
              processedData['labels'].push(label);
            }

            processedData['assigned_labels'].push({
              'parent_id': obj.id,
              'label': label.id,
            });
          });
        }

        // Milestone.
        if (_.has(obj, 'milestone') && obj.milestone) {
          let milestone_id = obj.milestone.id;
          obj.milestone_id = milestone_id;

          if(!_.find(processedData.milestones, {id: milestone_id})) {
            processedData['milestones'].push(obj.milestone);
          }
        }

        // User
        if (_.has(obj, 'user') && obj.user) {
          let user_id = obj.user.id;
          obj.user_id = user_id;

          if(!_.find(processedData.users, {id: user_id})) {
            processedData['users'].push(obj.user);
          }
        }
      });

      resolve(processedData);
    });
  }

}

export default Issues;


// Private helper functions.
