"use strict";

import 'babel-polyfill';
import GithubWDC from './GithubWDC';

const wdc = new GithubWDC();
tableau.registerConnector(wdc);

(function ($) {
  $(document).ready(function () {
    let accessToken = Cookies.get("accessToken") || false,
     isAuthenticated = accessToken && accessToken !== 'undefined' && accessToken.length > 0;

    // Update the UI to reflect the authentication status.
    updateUI(isAuthenticated);

    // Handle Github OAuth.
    $("#authenticate").click(function() {
      oAuthRedirect();
    });


    $('input[name=searchType]:radio, input[name=dataType]:radio').change(function() {
      let dataType = $('input[name=dataType]:checked').val();

      // Show examples
      $('#help > div').hide();
      $('#help-' + dataType).show();
    });

    $('form').submit(function connectorFormSubmitHandler(e) {
      let $fields = $('input, select, textarea').not('[type="password"],[type="submit"],[name="username"]'),
        data = {};

      e.preventDefault();

      // Format connection data according to assumptions.
      $fields.map(function getValuesFromFields() {
        let $this = $(this),
          name = $this.attr('name');

        switch (name) {
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

      // Initiate the data retrieval process.
      tableau.connectionName = "Github WDC";
      tableau.connectionData = JSON.stringify(data);
      tableau.submit();
    });
  });

  function oAuthRedirect() {
    window.location.href = '/github/login/oauth';
  }

  function updateUI(isAuthenticated) {
    if (isAuthenticated) {
      $(".anonymous").hide();
      $(".authenticated").show();
    } else {
      $(".anonymous").show();
      $(".authenticated").hide();
    }
  }

})(jQuery);
