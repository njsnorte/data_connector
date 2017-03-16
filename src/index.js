"use strict";

import GithubWDC from './GithubWDC';

const wdc = new GithubWDC();
tableau.registerConnector(wdc);

(function ($) {
  $(document).ready(function () {
    $('input[name=searchType]:radio, input[name=dataType]:radio').change(function() {
      let dataType = $('input[name=dataType]:checked').val();

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
      let $fields = $('input, select, textarea').not('[type="password"],[type="submit"],[name="username"]'),
        $password = $('input[type="password"]'),
        $username = $('input[name="username"]'),
        data = {};

      e.preventDefault();

      // Format connection data according to assumptions.
      $fields.map(function getValuesFromFields() {
        let $this = $(this),
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

      // Initiate the data retrieval process.
      tableau.connectionName = "Github WDC";
      tableau.username = $username.val();
      tableau.password = $password.val();
      tableau.connectionData = JSON.stringify(data);
      tableau.submit();
    });
  });
})(jQuery);
