import GithubObject from './GithubObject';
import $ from 'jquery';
import _ from 'lodash';
import debug from 'debug';

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
   * @param {string} [url]
   *  Request URI relative to the API base.
   * @param {string} [tableId]
   *  The table identifier.
   * @return {Array}
   *  Array of urls.
   */
  parseUrl(url, tableId) {
    switch (tableId) {
      case 'traffic_clones':
        url += '/clones';
        break;
      case 'traffic_popular_paths':
        url += '/popular/paths';
        break;
      case 'traffic_popular_referrers':
        url += '/popular/referrers';
        break;
      case 'traffic_views':
        url += '/views';
        break;
      case 'repos':
        url = url.replace(/\/traffic/ig, '');
        break;
      default:
        break;
    }

    return super.parseUrl(url, tableId);
  }

  /**
   * Process our traffic stats into a format that is more Tableau friendly.
   *
   * @param {Object} [result]
   *  An object where you wish to save the processed data onto.
   * @param {Object} [table]
   *  Table object which contains information about the columns and values.
   * @param {Array} [rawData]
   *  An array of objects to process.
   * @returns {Promise}
   */
  processData(result, table, rawData) {
    const tableId = table.tableInfo.id,
      incrementalId = table.tableInfo.incrementColumnId,
      incrementalValue = table.incrementValue;
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

        switch (tableId) {
          case 'traffic_views':
            _.forEach(obj.views, (obj) => {
              pushData(obj);
            });
            break;
          case 'traffic_clones':
            _.forEach(obj.clones, (obj) => {
              pushData(obj);
            });
            break;
          default:
            pushData(obj);
            break;
        }
      });

      // Closure that handles pushing data onto the result stack.
      function pushData(obj) {
        obj.repo_name = repo_owner + '/' + repo_name;

        // Add an additional timestamp field - if not provided by GitHub -
        // to support incremental refreshes. We set the timestamp to the
        // beginning of a day (i.e. 12 AM)
        if (!_.has(obj, 'timestamp')) {
          obj['timestamp'] = new Date(new Date().setHours(0,0,0,0)).toISOString();
        }

        // Handle incremental refresh.
        if (incrementalId && incrementalValue) {
          switch (incrementalId) {
            case 'timestamp':
              if (Date.parse(obj[incrementalId]) > Date.parse(incrementalValue)) {
                result[tableId].push(obj);
              }
              break;
            default:
              if (parseInt(obj[incrementalId]) > parseInt(incrementalValue)) {
                result[tableId].push(obj);
              }
          }
        }
        else {
          result[tableId].push(obj);
        }
      }

      resolve(result);
    });
  }

}

export default Traffic;


// Private helper functions.
