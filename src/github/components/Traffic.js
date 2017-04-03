import GithubObject from './GithubObject';
import debug from 'debug';
import $ from 'jquery';
import _ from 'lodash';

const log = debug('traffic');

/**
 * Make simple API calls to the Github API.
 */
class Traffic extends GithubObject {

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
   * Returns the relevant Github schema objects for traffic stats.
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
        Promise.resolve($.getJSON('/github/schema/repos.json')),
        Promise.resolve($.getJSON('/github/schema/traffic_clones.json')),
        Promise.resolve($.getJSON('/github/schema/traffic_popular_paths.json')),
        Promise.resolve($.getJSON('/github/schema/traffic_popular_referrers.json')),
        Promise.resolve($.getJSON('/github/schema/traffic_views.json'))],
        joinPromises = Promise.resolve($.getJSON('/github/schema/_traffic_joins.json'));

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
   * Parse query into useful API request urls.
   *
   * @param {string} [query]
   *  Query string to the API base.
   * @param {string} [tableId]
   *  The table identifier.
   * @return {Array}
   *  Array of urls.
   */
  parseQuery(query, tableId) {
    const options = query.split('?').slice(1).join('?');

    switch (tableId) {
      case 'traffic_clones':
        query += '/clones';
        break;
      case 'traffic_popular_paths':
        query += '/popular/paths';
        break;
      case 'traffic_popular_referrers':
        query += '/popular/referrers';
        break;
      case 'traffic_views':
        query += '/views';
        break;
      case 'repos':
        query = query.replace(/\/traffic/ig, '');
        break;
      default:
        break;
    }

    return super.parseQuery(query + options);
  }

  /**
   * Process our traffic stats into a format that is more Tableau friendly.
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
    let repo_owner, repo_name;
    result[tableId] = [];

    return new Promise((resolve, reject) => {
      _.forEach(rawData, (obj) => {
        // Parse out repo info.
        if (_.has(obj, '_request_url')) {
          const re = /repos\/([\w\-\.]+)\/([\w\-\.]+)/gi,
            match = re.exec(obj['_request_url']);

          if (match !== null) {
            repo_owner = match[1];
            repo_name = match[2];
          }
        }

        console.log(repo_name);

        switch (tableId) {
          case 'traffic_views':
            _.forEach(obj.views, (obj) => {
              obj.repo_name = repo_owner + '/' + repo_name;
              result[tableId].push(obj);
            });
            break;
          case 'traffic_clones':
            _.forEach(obj.clones, (obj) => {
              obj.repo_name = repo_owner + '/' + repo_name;
              result[tableId].push(obj);
            });
            break;
          default:
            obj.repo_name = repo_owner + '/' + repo_name;
            result[tableId].push(obj);
            break;
        }
      });

      resolve(result);
    });
  }

}

export default Traffic;


// Private helper functions.
