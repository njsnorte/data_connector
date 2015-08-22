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
      data = JSON.parse(tableau.connectionData);

    switch (data["dataType"]) {
      case 'comment':
        processedColumns = util.flattenHeaders(GitHubMeta.getComment(), null);
        break;
      case 'issue':
        processedColumns = util.flattenHeaders(GitHubMeta.getIssue(), null);
        break;
      case 'pr':
        processedColumns = util.flattenHeaders(GitHubMeta.getPullRequest(), null);
        break;
      default:
        throw 'Unsupported data-type';
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
    // Get the data.
    $.ajax({
      url: createAPIUrl(),
      headers: {
        Authorization: 'token ' + tableau.password
      },
      success: function dataRetrieved(response) {
        var processedData = [];

        alert(JSON.stringify(response, null, 3));

        // You may need to perform processing to shape the data into an array of
        // objects where each object is a map of column names to values.
        response.items.forEach(function shapeData(item) {
          processedData.push(util.flattenData(item, null));
        });

        // Once you've retrieved your data and shaped it into the form expected,
        // just call the registerData function.
        alert('processed');
        registerData(processedData);
      }
    });
  };

  // Private helper functions
  function createAPIUrl() {
    var data = JSON.parse(tableau.connectionData),
        query = data['query'],
        url = "https://api/github.com";

    alert(url + query);

    return url + query;
  }

})(jQuery, tableau, wdcw);
