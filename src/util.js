/**
 * Created by mkeereman on 8/20/15.
 */
var util = {};

/**
 * Checks if a given variable is an array.
 */
util.isArray = ('isArray' in Array) ?
  Array.isArray :
  function (value) {
    return Object.prototype.toString.call(value) === '[object Array]';
  };

/**
 * Flattens our data into an object with unique property names.
 *
 * @param {object} obj
 *  The object that contains all the data.
 * @return {object} result
 */
util.flattenData = function (obj) {
  var result = {};

  // Flatten our (nested) object.
  flatten(obj, '', function (key, item) {
    result[key] = item;
  });

  return result;
};

/**
 * Flattens our metadata into an associative array [{'name': 'Column_1', 'type': 'String'}]
 *
 * @param {object} obj
 *  The object that contains all the metadata (name and type).
 * @return {Array} result
 */
util.flattenHeaders = function (obj) {
  var result = [];

  // Flatten our (nested) object.
  flatten(obj, '', function (key, item) {
    result.push({
      'name': key,
      'type': item
    });
  });

  return result;
};

// Private helper methods.
function flatten (obj, ancestor, callback) {
  var item, key, parent;

  for (key in obj) {
    if (!obj.hasOwnProperty(key)) continue;

    item = obj[key];

    if (typeof item === 'object') {
      parent = ancestor + key + '.';
      flatten(item, parent, callback);

      continue;
    }

    if (util.isArray(item)) {
      for (var i=0; i < item.length; i++) {
        parent = ancestor + key + '-';
        flatten(item[i], parent, callback);
      }

      continue;
    }

    key = ancestor + key;
    callback(key, item);
  }
}
