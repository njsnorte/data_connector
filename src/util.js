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
 * Flattens an object and creates unique property names:
 *
 * @param {object} obj
 *  The object that contains all the data.
 * @param {string} prefix
 *  Optional prefix to prepend to the column name.
 * @return {object} result
 */
util.flattenData = function (obj, prefix) {
  var result = {},
    traverse = function(obj, prefix) {
      var item, key;

      for (key in obj) {
        if (!obj.hasOwnProperty(key)) continue;

        item = obj[key];

        if (typeof item === 'object') {
          prefix += key + '.';
          traverse(item, prefix);

          continue;
        }

        if (util.isArray(item)) {
          for (var i=0; i < item.length; i++) {
            prefix += key + '.';
            traverse(item[i], prefix);
          }

          continue;
        }

        key = prefix + key;
        result[key] = item;
      }
    };

  // Ensure we have a valid prefix.
  if (prefix == null || typeof(prefix) !== 'string') {
    prefix = '';
  }

  // Traverse over our (nested) object.
  traverse(obj, prefix);

  return result;
};

/**
 * Flattens our metadata to an associative array [{'name': 'Column_1', 'type': 'String'}]
 *
 * @param {object} obj
 *  The object that contains all the metadata (name and type).
 * @param {string} prefix
 *  Optional prefix to prepend to the column name.
 * @return {Array} result
 */
util.flattenHeaders = function (obj, prefix) {
  var result = [],
    traverse = function(obj, prefix) {
      var item, key;

      for (key in obj) {
        if (!obj.hasOwnProperty(key)) continue;

        item = obj[key];

        if (typeof item === 'object') {
          prefix += key + '.';
          traverse(item, prefix, result);

          continue;
        }

        if (item.constructor === 'array') {
          for (var i=0; i < item.length; i++) {
            prefix += key + '.';
            traverse(item[i], prefix, result);
          }

          continue;
        }

        key = prefix + key;
        result.push({
          'name': key,
          'type': item,
        });
      }
    };

  // Ensure we have a valid prefix.
  if (prefix == null || typeof(prefix) !== 'string') {
    prefix = '';
  }

  // Traverse over our (nested) object.
  traverse(obj, prefix);

  return result;
};
