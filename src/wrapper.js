/**
 * @file
 *   A utility that wraps the Tableau Web Data Connector API into something with
 *   more opinionated, and simple for beginners. Also takes care of very common
 *   setup and event handling boilerplate.
 */

var wdcw = window.wdcw || {};

(function($, tableau, wdcw) {
  var connector = tableau.makeConnector();

  /**
   * Simplifies the connector.init method in several ways:
   * - Makes it so the implementor doesn't have to know to call the
   *   tableau.initCallback method.
   * - Passes the current phase directly to the initializer so that it doesn't
   *   have to know to pull it from the global tableau object.
   * - Handles population of saved data on behalf of the implementor during the
   *   interactive phase.
   * - Unifies the callback-based API of all connector wrapper methods, and
   *   simplifies asynchronous set-up tasks in the process.
   */
  connector.init = function callConnectorInit() {
    var data = this.getConnectionData(),
        $input,
        key;

    // Auto-fill any inputs with known data values.
    if (tableau.phase === tableau.phaseEnum.interactivePhase) {
      for (key in data) {
        if (data.hasOwnProperty(key)) {
          $input = $('*[name="' + key + '"]');
          if ($input.length) {
            $input.val(data[key]);
          }
        }
      }

      // Pre-populate username and password if stored values exist.
      if (tableau.username) {
        $('input[name="username"]').val(tableau.username);
      }
      if (tableau.password) {
        $('input[type="password"]').val(tableau.password);
      }
    }

    // If the provided connector wrapper has a setup property, call it with the
    // current initialization phase.
    if (wdcw.hasOwnProperty('setup')) {
      wdcw.setup.call(this, tableau.phase, function setUpComplete() {
        tableau.initCallback();
      });
    }
    else {
      tableau.initCallback();
    }
  };

  /**
   * Simplifies the connector.shutDown method in a couple of ways:
   * - Makes it so that the implementor doesn't have to know to call the
   *   tableau.shutdownCallback method.
   * - Mirrors the wrapped init callback for naming simplicity (setup/teardown).
   * - Unifies the callback-based API of all connector wrapper methods, and
   *   simplifies asynchronous tear-down tasks in the process.
   */
  connector.shutDown = function callConnectorShutdown() {
    // If the provided connector wrapper has a teardown property, call it.
    if (wdcw.hasOwnProperty('teardown')) {
      wdcw.teardown.call(this, function shutDownComplete() {
        tableau.shutdownCallback();
      });
    }
    else {
      tableau.shutdownCallback();
    }
  };

  /**
   * Simplifies the connector.getColumnHeaders method in a few ways:
   * - Enables simpler asynchronous handling by making the interface only accept
   *   a callback.
   * - Simplifies the API by expecting an array of objects, mapping field names
   *   and types on a single object, rather than in two separate arrays.
   * - Makes it so the implementor doesn't have to know to call the
   *   tableau.headersCallback method.
   */
  connector.getColumnHeaders = function callConnectorColumnHeaders() {
    wdcw.columnHeaders.call(this, function getColumnHeadersSuccess(headers) {
      var names = [],
          types = [];

      // Iterate through returned column header objects and process them into the
      // format expected by the API.
      headers.forEach(function(header) {
        names.push(header.name);
        types.push(header.type);
      });

      tableau.headersCallback(names, types);
    });
  };

  /**
   * Simplifies (and limits) the connector.getTableData method in a couple ways:
   * - Enables simpler asynchronous handling by making the interface only accept
   *   a callback.
   * - Removes the complexity introduced by allowing tableau to be aware of
   *   data paging. It's simpler to let the implementor control that logic.
   * - Makes it so the implementor doesn't have to know to call the
   *   tableau.dataCallback method.
   */
  connector.getTableData = function callConnectorTableData() {
    wdcw.tableData.call(this, function getTableDataSuccess(data) {
      tableau.dataCallback(data, null, false);
    });
  };

  /**
   * Extension of the web data connector API that handles complex connection
   * data getting for the implementor.
   *
   * @returns {object}
   *   An object representing connection data. Keys are assumed to be form input
   *   names; values are assumed to be form input values.
   *
   * @see connector.setConnectionData
   */
  connector.getConnectionData = function getConnectionData() {
    return tableau.connectionData ? JSON.parse(tableau.connectionData) : {};
  };

  /**
   * Extension of the web data connector API that handles complex connection
   * data setting for the implementor.
   *
   * @param {object} data
   *   The data that's intended to be set for this connection. Keys are assumed
   *   to be form input names; values are assumed to be form input values.
   *
   * @returns {object}
   *   Returns the data that was set.
   *
   * @see connector.getConnectionData
   */
  connector.setConnectionData = function setConnectionData(data) {
    tableau.connectionData = JSON.stringify(data);
    return data;
  };

  // Register our connector, which uses logic from the connector wrapper.
  tableau.registerConnector(connector);

  /**
   * Register a submit handler and take care of the following on behalf of the
   * implementor:
   * - Parse and store form data in tableau's connection data property.
   * - Provide the connection name.
   * - Trigger the data collection phase of the web data connector.
   */
  $(document).ready(function connectorDocumentReady() {
    $('input[name=searchType]:radio, input[name=dataType]:radio').change(function() {
      var dataType = $('input[name=dataType]:checked').val();

      // Show examples
      $('#help > div').hide();
      $('#help-' + dataType).show();

      // Data Type specific settings
      $('#settings > div').hide();
      $('#settings-maxNumberOfRows').show();
      $('#settings-timeout').show();
      switch (dataType) {
        case 'issue':
          $('#settings-labelFilter').show();
          break;
        default:
          break;
      }
    });

    $('form').submit(function connectorFormSubmitHandler(e) {
      var $fields = $('input, select, textarea').not('[type="password"],[type="submit"],[name="username"]'),
          $password = $('input[type="password"]'),
          $username = $('input[name="username"]'),
          data = {};

      e.preventDefault();

      // Format connection data according to assumptions.
      $fields.map(function getValuesFromFields() {
        var $this = $(this),
            name = $this.attr('name');

        switch (name) {
          case 'searchType':
          case 'dataType':
            if ($this.is(':checked')) {
              data[name] = $this.val();
            }
            break;
          default:
            data[name] = $this.val();
            break;
        }

        return this;
      });

      // If nothing was entered, there was a problem. Abort.
      // @todo Automatically add validation handling.
      if (data === {}) {
        return false;
      }

      // Set connection data and connection name.
      wdcw.data = data;
      connector.setConnectionData(data);
      tableau.connectionName = 'github-data-connector';

      // If there was a password, set the password.
      if ($password) {
        tableau.password = $password.val();
      }

      // If there was a username, set the username.
      if ($username) {
        tableau.username = $username.val();
      }

      // Initiate the data retrieval process.
      tableau.submit();
    });
  });

})(jQuery, tableau, wdcw);
