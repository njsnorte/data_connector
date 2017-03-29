"use strict";

//import 'babel-polyfill';
import _ from 'lodash';
import GithubWDC from './GithubWDC';

const wdc = new GithubWDC();
tableau.registerConnector(wdc);

(function ($) {
  $(document).ready(function () {
    const $inputFields = $('input, select, textarea').not('[type="submit"]');

    // Set default values (base on connection data).
    setFieldsFromValues($inputFields, wdc.getConnectionData());

    // Handle Github OAuth.
    $("#authenticate").click(oAuthRedirect);

    //
    $('input[name=searchType]:radio, input[name=dataType]:radio').change(function() {
      const dataType = $('input[name=dataType]:checked').val();

      // Show examples
      $('#help > div').hide();
      $('#help-' + dataType).show();
    });

    // Handles WDC submission.
    $('form').submit(function connectorFormSubmitHandler(e) {
      e.preventDefault();

      // Retrieve connection data from input fields.
      const data = getValuesFromFields($inputFields);

      // Initiate the data retrieval process.
      tableau.connectionName = "Github WDC";
      tableau.connectionData = JSON.stringify(data);
      tableau.submit();
    });
  });

  /**
   * Update the UI depending on whether the user has authenticated.
   *
   * @param {bool}[isAuthenticated]
   *  TRUE if the user is authenticated, FALSE otherwise.
   */
  $(document).on('updateUI', function (e, isAuthenticated) {
    if (isAuthenticated) {
      $(".anonymous").hide();
      $(".authenticated").show();
    } else {
      $(".anonymous").show();
      $(".authenticated").hide();
    }
  });

  /**
   * Perform Github OAuth,
   */
  function oAuthRedirect() {
    window.location.href = '/github/login/oauth';
  }

  /**
   * Set default field values.
   *
   * @param $fields
   *  Fields to iterate over.
   * @param {object}[data]
   *  Values to assign.
   */
  function setFieldsFromValues($fields, data) {
    $fields.each(function (index, value) {
      const $field = $(this),
        name = $field.attr('name'),
        type = $field.attr('type');

      if (_.has(data, name)) {
        $field.val(data[name]);
      }
    });
  }

  /**
   * Retrieve a list of field values by field name.
   * @param $fields
   *  Fields to iterate over.
   */
  function getValuesFromFields($fields) {
    const data = {};

    $fields.each(function (index, value) {
      const $field = $(this),
        name = $field.attr('name');

      data[name] = $field.val();
    });

    return data;
  }

})(jQuery);
