/*
 * Copyright (c) 2018, FusionAuth, All Rights Reserved
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the License for the specific
 * language governing permissions and limitations under the License.
 */

'use strict';

/**
 * RESTful WebService call builder. This provides the ability to call RESTful WebServices using a builder pattern to
 * set up all the necessary request information and parse the response.
 *
 * @constructor
 */
var RESTClient = function() {
  for (var property in this) {
    if (this[property] instanceof Function) {
      this[property] = this[property].bind(this);
    }
  }

  this.headers = {};
  this.parameters = null;
  this.restUrl = null;
  this.body = null;
  this.method = null;
};

RESTClient.constructor = RESTClient;
RESTClient.prototype = {
  /**
   * Sets the authorization header using a key
   *
   * @param {string} key The value of the authorization header.
   * @returns {RESTClient}
   */
  authorization: function(key) {
    if (key === null || typeof key === 'undefined') {
      return this;
    }

    this.header('Authorization', key);
    return this;
  },

  /**
   * Sets the authorization header using username and password
   *
   * @param {string} username
   * @param {string} password
   * @returns {RESTClient}
   */
  basicAuthorization: function(username, password) {
    if (username && password) {
      this.header('Authorization', 'Basic ' + btoa(username + ':' + password));
    }
    return this;
  },

  /**
   * Sets the body of the client request.
   *
   * @param {Object} body The object to be written to the request body as form data.
   * @returns {RESTClient}
   */
  setFormData: function(body) {
    this.body = body;
    this.header('Content-Type', 'application/x-www-form-urlencoded');
    return this;
  },

  /**
   * Sets the body of the client request.
   *
   * @param {Object} body The object to be written to the request body as JSON.
   * @returns {RESTClient}
   */
  setJSONBody: function(body) {
    this.body = JSON.stringify(body);
    this.header('Content-Type', 'application/json');
    // Omit the Content-Length, this is set by the browser. It is considered an un-safe header to set manually.
    return this;
  },

  /**
   * Sets the http method to DELETE
   *
   * @returns {RESTClient}
   */
  delete: function() {
    this.method = 'DELETE';
    return this;
  },

  /**
   * Sets the http method to GET
   *
   * @returns {RESTClient}
   */
  get: function() {
    this.method = 'GET';
    return this;
  },

  /**
   * Sets the http method to PATCH
   *
   * @returns {RESTClient}
   */
  patch: function() {
    this.method = 'PATCH';
    return this;
  },

  /**
   * Sets the http method to POST
   *
   * @returns {RESTClient}
   */
  post: function() {
    this.method = 'POST';
    return this;
  },

  /**
   * Sets the http method to PUT
   *
   * @returns {RESTClient}
   */
  put: function() {
    this.method = 'PUT';
    return this;
  },

  /**
   * Creates the request to the REST API.
   *
   * @param {Function} callBack
   */
  go: function(callBack) {
    if (this.parameters) {
      this.restUrl = this.restUrl + this._getQueryString();
    }

    var clientResponse = new ClientResponse();
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      // readyState is DONE
      if(xhr.readyState === 4) {
        clientResponse.statusCode = xhr.status;

        var json = xhr.responseText;
        try {
          json = JSON.parse(xhr.responseText);
        } catch (err) {
        }
        if (xhr.status >= 200 && xhr.status <= 299) {
          clientResponse.successResponse = json;
        } else {
          clientResponse.errorResponse = json;
        }

        callBack(clientResponse);
      }
    };

    xhr.open(this.method, this.restUrl, true);
    for (var header in this.headers) {
      xhr.setRequestHeader(header, this.headers[header]);
    }
    xhr.send(this.body);
  },

  /**
   * Creates a header field in the format 'key' : value
   *
   * @param {string} key
   * @param {Object} value
   * @returns {RESTClient}
   */
  header: function(key, value) {
    if (value === null || typeof value === 'undefined') {
      return this;
    }

    this.headers[key] = value;
    return this;
  },

  /**
   * Sets the entire header field.
   *
   * @param {string} headers The headers in a JSON object of key value pairs.
   * @returns {RESTClient}
   */
  setHeaders: function(headers) {
    this.headers = headers;
    return this;
  },

  /**
   * Sets the ssl key for request to https endpoints.
   * @param {string} key
   * @returns {RESTClient}
   */
  setKey: function(key) {
    this.key = key;
    return this;
  },

  /**
   * Sets the uri of the REST request
   * @param {?string} uri
   * @returns {RESTClient}
   */
  uri: function(uri) {
    if (uri === null || typeof this.restUrl === 'undefined') {
      return this;
    }

    if (this.restUrl.charAt(this.restUrl.length - 1) === '/' && uri.charAt(0) === '/') {
      this.restUrl = this.restUrl + uri.substring(1);
    } else if (this.restUrl.charAt(this.restUrl.length - 1) !== '/' && uri.charAt(0) !== '/') {
      this.restUrl = this.restUrl + '/' + uri;
    } else {
      this.restUrl = this.restUrl + uri;
    }

    return this;
  },

  /**
   * Sets the host of the REST request.
   *
   * @param {string} url
   * @returns {RESTClient}
   */
  setUrl: function(url) {
    this.restUrl = url;
    return this;
  },

  /**
   * Adds url parameters to the REST request.
   *
   * @param {!string} name The name of the parameter.
   * @param {?string|Object|number} value The value of the URL parameter, may be a string, object or number.
   * @returns {RESTClient}
   */
  urlParameter: function(name, value) {
    if (value !== null && typeof value !== 'undefined') {
      if (this.parameters === null) {
        this.parameters = {};
      }
      const values = this.parameters[name];
      if (values === undefined) {
        this.parameters[name] = [];
      }
      if (typeof value === 'object') {
        for (let v in value) {
          if (value.hasOwnProperty(v)) {
            this.parameters[name].push(value[v]);
          }
        }
      } else {
        this.parameters[name].push(value);
      }
    }
    return this;
  },

  /**
   * Adds a url path segments to the REST request.
   *
   * @param {?string} segment
   * @returns {RESTClient}
   */
  urlSegment: function(segment) {
    if (segment !== null && typeof segment !== 'undefined') {
      if (this.restUrl.charAt(this.restUrl.length - 1) !== '/') {
        this.restUrl = this.restUrl + '/';
      }
      this.restUrl = this.restUrl + segment;
    }
    return this;
  },

  _getQueryString: function() {
    var queryString = '';
    for (var parameter in this.parameters) {
      if (this.parameters.hasOwnProperty(parameter)) {
        queryString += (queryString.length === 0) ? '?' : '&';
        queryString += parameter + '=' + encodeURIComponent(this.parameters[parameter]);
      }
    }

    return queryString;
  }
};