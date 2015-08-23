var express = require('express'),
    port = process.env.PORT || 3000,
    app = express();

app.use(express.static(__dirname + '/build'));

app.listen(app.get('port'), function () {
  console.log("Github Web Data Connector is running on port " + app.get('port'));
});
