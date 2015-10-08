var wdcw = window.wdcw || {};

(function($, tableau, wdcw) {

  /**
   * Run during initialization of the web data connector.
   *
   * @param {string} phase
   *   The initialization phase. This can be one of:
   *   - tableau.phaseEnum.interactivePhase: Indicates when the connector is
   *     being initialized with a user interface suitable for an end-user to
   *     enter connection configuration details.
   *   - tableau.phaseEnum.gatherDataPhase: Indicates when the connector is
   *     being initialized in the background for the sole purpose of collecting
   *     data.
   *   - tableau.phaseEnum.authPhase: Indicates when the connector is being
   *     accessed in a stripped down context for the sole purpose of refreshing
   *     an OAuth authentication token.
   * @param {function} setUpComplete
   *   A callback function that you must call when all setup tasks have been
   *   performed.
   */
  wdcw.setup = function setup(phase, setUpComplete) {
    // You may need to perform set up or other initialization tasks at various
    // points in the data connector flow. You can do so here.
     switch (phase) {
      case tableau.phaseEnum.interactivePhase:
        // Perform set up tasks that relate to when the user will be prompted to
        // enter information interactively.
        break;

      case tableau.phaseEnum.gatherDataPhase:
        // Perform set up tasks that should happen when Tableau is attempting to
        // retrieve data from your connector (the user is not prompted for any
        // information in this phase.
        break;

      case tableau.phaseEnum.authPhase:
        // Perform set up tasks that should happen when Tableau is attempting to
        // refresh OAuth authentication tokens.
        break;
    }

    // Always register when initialization tasks are complete by calling this.
    // This can be especially useful when initialization tasks are asynchronous
    // in nature.
    setUpComplete();
  };

  /**
   * Run when the web data connector is being unloaded. Useful if you need
   * custom logic to clean up resources or perform other shutdown tasks.
   *
   * @param {function} tearDownComplete
   *   A callback function that you must call when all shutdown tasks have been
   *   performed.
   */
  wdcw.teardown = function teardown(tearDownComplete) {
    // Once shutdown tasks are complete, call this. Particularly useful if your
    // clean-up tasks are asynchronous in nature.
    tearDownComplete();
  };

  /**
   * Primary method called when Tableau is asking for the column headers that
   * this web data connector provides. Takes a single callable argument that you
   * should call with the headers you've retrieved.
   *
   * @param {function(Array<{name, type}>)} registerHeaders
   *   A callback function that takes an array of objects as its sole argument.
   *   For example, you might call the callback in the following way:
   *   registerHeaders([
   *     {name: 'Boolean Column', type: 'bool'},
   *     {name: 'Date Column', type: 'date'},
   *     {name: 'DateTime Column', type: 'datetime'},
   *     {name: 'Float Column', type: 'float'},
   *     {name: 'Integer Column', type: 'int'},
   *     {name: 'String Column', type: 'string'}
   *   ]);
   */
  wdcw.columnHeaders = function columnHeaders(registerHeaders) {
    var processedColumns,
        dataType = getConnectionData('dataType');

    switch (dataType) {
      case 'comment':
        processedColumns = util.flattenHeaders(GitHubMeta.getComment());
        break;
      case 'issue':
        processedColumns = util.flattenHeaders(GitHubMeta.getIssue());
        break;
      case 'label':
        processedColumns = util.flattenHeaders(GitHubMeta.getLabel());
        break;
      case 'milestone':
        processedColumns = util.flattenHeaders(GitHubMeta.getMilestone());
        break;
      case 'pr':
        processedColumns = util.flattenHeaders(GitHubMeta.getPullRequest());
        break;
      case 'repo':
        processedColumns = util.flattenHeaders(GitHubMeta.getRepository());
        break;
      default:
        tableau.abortWithError('Unsupported data-type');
    }

    // Once data is retrieved and processed, call registerHeaders().
    registerHeaders(processedColumns);
  };

  /**
   * Primary method called when Tableau is asking for your web data connector's
   * data. Takes a single callable argument that you should call with all of the
   * data you've retrieved.
   *
   * @param {function(Array<{object}>)} registerData
   *   A callback function that takes an array of objects as its sole argument.
   *   Each object should be a simple key/value map of column name to column
   *   value. For example, you might call the callback in the following way:
   *   registerData([
   *     {'String Column': 'String Column Value', 'Integer Column': 123}
   *   ]});
   */
  wdcw.tableData = function tableData(registerData) {
    var urls = createAPIUrl(),
        count = 0,
        counter = 0,
        connectionData = getConnectionData(),
        maxNumberOfRows = connectionData['maxNumberOfRows'],
        timeout = connectionData['timeout'] * 60000,
        processedData = [];

    urls.forEach(function apiCalls(url) {
      var start_time = new Date().getTime();
      counter ++;

      getData(url, timeout, function getNextData(data, next) {
        var request_time = new Date().getTime() - start_time;
        timeout -= request_time;
        count += data.length;

        // Process our data and add to the array of results.
        data.forEach(function shapeData(item) {
          if (connectionData['dataType'] === 'issue' && _.has(connectionData, 'labelFilter') && util.isArray(item.labels)) {
            item.labels = _.pluck(item.labels, 'name');
          }

          processedData.push(util.flattenData(item));
        });

        if (next && count < maxNumberOfRows && timeout > 0) {
          start_time = new Date().getTime();
          getData(next, timeout, getNextData);
        } else {
          counter --;

          if (counter === 0) {
            registerData(processedData);
          }
        }
      });
    });
  };

  // Private helper functions

  /**
   *  Get the connection data.
   *  @param {string} property
   *   (optional) value to return.
   */
  function getConnectionData(property) {
    data = JSON.parse(tableau.connectionData);

    if (property && typeof property === "string") {
      return data[property];
    }
    else {
      return data;
    }
  }

  /**
   * Ajax call to our API
   *
   * @param {string} url
   *  The url used for our API call.
   * @param {function(data, next)} callback
   *  A callback function which takes two arguments:
   *   data: result set from the API call.
   *   next: A url to our next page (if any) or false if no next page was found.
   */
  function getData (url, timeout, callback) {
    $.ajax({
      url: url,
      headers: {
        Authorization: 'token ' + tableau.password
      },
      timeout: timeout,
      success: function(result, textStatus, jqXHR) {
        var link = jqXHR.getResponseHeader('link'),
            next = getNextPage(link);

        // GET queries return an array of results.
        if (util.isArray(result)) {
          data = result;
        }
        // SEARCH queries return an object with an array of results in "items".
        else if (typeof result === 'object' && util.isArray(result.items)) {
          data = result.items;
        } else {
          tableau.abortWithError('Unexpected result set, please check your API call syntax.');
        }

        callback(data, next);
      },
      error: function (jqXHR, textStatus, error) {
        if (textStatus === 'timeout') {
          tableau.abortWithError('API call timed out on the following query: ' + url + '.');
        }
        else {
          tableau.abortWithError('Invalid API call: ' + url + '. \n Please check your syntax. Error:' + error);
        }
      }
    });
  }

  /**
   * Creates an array of urls for our API calls.
   */
  function createAPIUrl() {
    var query = getConnectionData('query'),
        path = "https://api.github.com/",
        repoRegex = /repos\/.*\/\[.*\]/g,
        urls = [];

    // Look for repository array
    if (repoRegex.test(query)) {
      var reg = /\[(.*)\]/g,
          match = reg.exec(query)[1],
          delimited = match.split(','),
          url;

      delimited.forEach(function (q) {
        url = query.replace(reg, q);
        urls.push(path + url);
      });
    } else {
      urls.push(path + query);
    }

    return urls;
  }

  /**
   * Gets a url to the next page of the result set.
   *
   * @param link
   *  The meta data ['link'] from our response header.
   * @returns {*}
   *  The url to our next page, or false if no next page was found.
   */
  function getNextPage(link) {
    var links = {};

    if (!link || typeof link != "string") return false;

    link.replace(/<([^>]*)>;\s*rel="([\w]*)\"/g, function(m, uri, type) {
      links[type] = uri;
    });

    return links.next;
  }

})(jQuery, tableau, wdcw);
