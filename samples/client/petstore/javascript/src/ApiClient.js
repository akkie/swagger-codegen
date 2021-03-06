(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['superagent'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('superagent'));
  } else {
    // Browser globals (root is window)
    if (!root.SwaggerPetstore) {
      root.SwaggerPetstore = {};
    }
    root.SwaggerPetstore.ApiClient = factory(root.superagent);
  }
}(this, function(superagent) {
  'use strict';

  var ApiClient = function ApiClient() {
    this.basePath = 'http://petstore.swagger.io/v2'.replace(/\/+$/, '');
  };

  ApiClient.prototype.paramToString = function paramToString(param) {
    if (param == null) {
      // return empty string for null and undefined
      return '';
    } else {
      return param.toString();
    }
  };

  /**
   * Build full URL by appending the given path to base path and replacing
   * path parameter placeholders with parameter values.
   * NOTE: query parameters are not handled here.
   */
  ApiClient.prototype.buildUrl = function buildUrl(path, pathParams) {
    if (!path.match(/^\//)) {
      path = '/' + path;
    }
    var url = this.basePath + path;
    var _this = this;
    url = url.replace(/\{([\w-]+)\}/g, function(fullMatch, key) {
      var value;
      if (pathParams.hasOwnProperty(key)) {
        value = _this.paramToString(pathParams[key]);
      } else {
        value = fullMatch;
      }
      return encodeURIComponent(value);
    });
    return url;
  };

  /**
   * Check if the given MIME is a JSON MIME.
   * JSON MIME examples:
   *   application/json
   *   application/json; charset=UTF8
   *   APPLICATION/JSON
   */
  ApiClient.prototype.isJsonMime = function isJsonMime(mime) {
    return Boolean(mime != null && mime.match(/^application\/json(;.*)?$/i));
  };

  /**
   * Choose a MIME from the given MIMEs with JSON preferred,
   * i.e. return JSON if included, otherwise return the first one.
   */
  ApiClient.prototype.jsonPreferredMime = function jsonPreferredMime(mimes) {
    var len = mimes.length;
    for (var i = 0; i < len; i++) {
      if (this.isJsonMime(mimes[i])) {
        return mimes[i];
      }
    }
    return mimes[0];
  };

  /**
   * Normalize parameters values:
   *   remove nils,
   *   keep files and arrays,
   *   format to string with `paramToString` for other cases.
   */
  ApiClient.prototype.normalizeParams = function normalizeParams(params) {
    var newParams = {};
    for (var key in params) {
      if (params.hasOwnProperty(key) && params[key] != null) {
        var value = params[key];
        if (value instanceof Blob || Array.isArray(value)) {
          newParams[key] = value;
        } else {
          newParams[key] = this.paramToString(value);
        }
      }
    }
    return newParams;
  };

  ApiClient.prototype.callApi = function callApi(path, httpMethod, pathParams,
      queryParams, headerParams, formParams, bodyParam, contentTypes, accepts,
      callback) {
    var url = this.buildUrl(path, pathParams);
    var request = superagent(httpMethod, url);

    // set query parameters
    request.query(this.normalizeParams(queryParams));

    // set header parameters
    request.set(this.normalizeParams(headerParams));

    var contentType = this.jsonPreferredMime(contentTypes) || 'application/json';
    request.type(contentType);

    if (contentType === 'application/x-www-form-urlencoded') {
      request.send(this.normalizeParams(formParams));
    } else if (contentType == 'multipart/form-data') {
      var _formParams = this.normalizeParams(formParams);
      for (var key in _formParams) {
        if (_formParams.hasOwnProperty(key)) {
          if (_formParams[key] instanceof Blob) {
            // file field
            request.attach(key, _formParams[key]);
          } else {
            request.field(key, _formParams[key]);
          }
        }
      }
    } else if (bodyParam) {
      request.send(bodyParam);
    }

    var accept = this.jsonPreferredMime(accepts);
    if (accept) {
      request.accept(accept);
    }

    request.end(function(error, response) {
      if (callback) {
        var data = response && response.body;
        callback(error, data, response);
      }
    });

    return request;
  };

  ApiClient.default = new ApiClient();

  return ApiClient;
}));
